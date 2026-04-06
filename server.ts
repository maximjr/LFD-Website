console.log("Starting server.ts...");

import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, getApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import cron from "node-cron";
import fs from 'fs';
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";

console.log("Imported all modules successfully");

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Logging System
// ============================================================================
const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data || ""),
  error: (msg: string, err?: any) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err || ""),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data || ""),
};

// ============================================================================
// Configuration & Initialization
// ============================================================================
let db: FirebaseFirestore.Firestore;
let auth: any;
let transporter: any;

try {
  const configPath = new URL('./firebase-applet-config.json', import.meta.url);
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const appAdmin = initializeApp({
    projectId: firebaseConfig.projectId,
  });

  db = getFirestore(appAdmin, firebaseConfig.firestoreDatabaseId);
  auth = getAuth(appAdmin);
  logger.info("Firebase Admin initialized successfully");
} catch (error) {
  logger.error("Failed to initialize Firebase Admin", error);
  process.exit(1);
}

// Nodemailer Setup
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'info.lfdservice@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-hardcoded-password-here',
    },
  });
  logger.info("Nodemailer transporter created");
} catch (error) {
  logger.error("Failed to create Nodemailer transporter", error);
}

// ============================================================================
// Standardized Response Helper
// ============================================================================
interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: {
    code: string;
    details?: any;
  } | null;
}

function sendResponse(res: Response, status: number, payload: ApiResponse) {
  return res.status(status).json(payload);
}

// ============================================================================
// Middleware
// ============================================================================
async function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendResponse(res, 401, {
      success: false,
      message: "Unauthorized",
      error: { code: "UNAUTHORIZED", details: "Missing or invalid token" }
    });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return sendResponse(res, 401, {
      success: false,
      message: "Unauthorized",
      error: { code: "INVALID_TOKEN", details: "Token verification failed" }
    });
  }
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests",
    error: { code: "RATE_LIMIT_EXCEEDED" }
  }
});

// ============================================================================
// Subscription Retry System
// ============================================================================
async function logRetryAttempt(userId: string, subscriptionId: string, attempt: number, status: string, error?: string) {
  await db.collection("subscriptionRetryLogs").add({
    userId,
    subscriptionId,
    attemptNumber: attempt,
    status,
    errorMessage: error || null,
    timestamp: FieldValue.serverTimestamp()
  });
}

async function processSubscriptionRetry(userId: string, subscriptionId: string, attempt: number = 1) {
  console.log(`Processing retry attempt ${attempt} for subscription ${subscriptionId}`);
  
  try {
    const subRef = db.collection("subscriptions").doc(subscriptionId);
    const subDoc = await subRef.get();
    
    if (!subDoc.exists) {
      await logRetryAttempt(userId, subscriptionId, attempt, "failed", "Subscription document not found");
      return;
    }

    const subData = subDoc.data()!;
    
    // Check if already active
    if (subData.status === 'active') {
      await logRetryAttempt(userId, subscriptionId, attempt, "success", "Subscription already active");
      return;
    }

    // Check if an unused code already exists
    const existingCodesSnapshot = await db.collection("activationCodes")
      .where("userId", "==", userId)
      .where("subscriptionId", "==", subscriptionId)
      .where("activationStatus", "==", false)
      .get();

    let rawCode: string;
    let expirationTime: Date;

    if (!existingCodesSnapshot.empty) {
      // Reuse existing code (we can't retrieve the raw code from the hash, so we must generate a new one if we didn't store it)
      // Actually, since we only store the hash, we MUST generate a new raw code and update the document, or just create a new one and delete the old.
      // Let's just delete old pending codes for this subscription to keep it clean.
      const batch = db.batch();
      existingCodesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    rawCode = generateActivationCode();
    const hashedCode = await bcrypt.hash(rawCode, 10);
    expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store Activation Code
    await db.collection("activationCodes").add({
      userId,
      email: subData.email,
      activationCode: hashedCode,
      subscriptionId: subscriptionId,
      subscriptionStatus: "pending",
      activationStatus: false,
      createdAt: FieldValue.serverTimestamp(),
      expirationTime: Timestamp.fromDate(expirationTime),
      attempts: 0
    });

    // Send Email
    const mailOptions = {
      from: '"LFD Services" <info.lfdservice@gmail.com>',
      to: subData.email,
      subject: "Your LFD Service Activation Code",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #064e3b;">Hello ${subData.name},</h2>
          <p>Your activation code is ready.</p>
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #064e3b;">${rawCode}</span>
          </div>
          <p>Please enter this code on the activation page.</p>
          <p style="color: #64748b; font-size: 14px;">This code will expire in 24 hours.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    await logRetryAttempt(userId, subscriptionId, attempt, "success");
    console.log(`Retry attempt ${attempt} successful for ${subscriptionId}`);

  } catch (error: any) {
    console.error(`Retry attempt ${attempt} failed:`, error);
    await logRetryAttempt(userId, subscriptionId, attempt, "failed", error.message);

    if (attempt < 3) {
      const intervals = [10000, 30000, 120000]; // 10s, 30s, 2m
      setTimeout(() => {
        processSubscriptionRetry(userId, subscriptionId, attempt + 1);
      }, intervals[attempt - 1]);
    } else {
      // Final failure
      await db.collection("subscriptions").doc(subscriptionId).update({ status: "failed" });
      // Notify user of final failure (optional, but good practice)
    }
  }
}

// ============================================================================
// Helper to generate activation code
// ============================================================================
function generateActivationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = Math.floor(Math.random() * 3) + 6; // 6 to 8 chars
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================================================
// Automated Maintenance & Notification System
// ============================================================================
async function runMaintenance() {
  console.log("Starting automated maintenance...");
  const log = {
    date: FieldValue.serverTimestamp(),
    actionsPerformed: [] as string[],
    errorsFound: [] as string[],
    fixesApplied: [] as string[]
  };

  try {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // 1 & 2. Subscription Status Update & Cleanup
    const subsSnapshot = await db.collection("subscriptions").get();
    let expiredCount = 0;
    let deletedSubCount = 0;

    // Helper to commit batches in chunks of 500
    const commitInChunks = async (docs: any[], operation: (batch: FirebaseFirestore.WriteBatch, doc: any) => void) => {
      for (let i = 0; i < docs.length; i += 500) {
        const chunk = docs.slice(i, i + 500);
        const batch = db.batch();
        chunk.forEach(doc => operation(batch, doc));
        await batch.commit();
      }
    };

    const subsToUpdate: any[] = [];
    const subsToDelete: any[] = [];

    subsSnapshot.forEach(doc => {
      const data = doc.data();
      const expiry = data.expiryDate?.toMillis();
      
      if (data.status === 'active' && expiry && expiry < now) {
        subsToUpdate.push(doc);
        expiredCount++;
      } else if (data.status === 'expired' && expiry && expiry < thirtyDaysAgo) {
        subsToDelete.push(doc);
        deletedSubCount++;
      }
    });

    if (subsToUpdate.length > 0) {
      await commitInChunks(subsToUpdate, (batch, doc) => batch.update(doc.ref, { status: 'expired' }));
      log.actionsPerformed.push(`Marked ${expiredCount} subscriptions as expired.`);
    }
    if (subsToDelete.length > 0) {
      await commitInChunks(subsToDelete, (batch, doc) => batch.delete(doc.ref));
      log.actionsPerformed.push(`Removed ${deletedSubCount} old expired subscriptions.`);
    }
    if (expiredCount > 0 || deletedSubCount > 0) {
      log.fixesApplied.push("Updated subscription statuses and cleaned old records.");
    }

    // 3. Unused Activation Keys Cleanup
    const keysSnapshot = await db.collection("activationKeys").where("status", "==", "unused").get();
    let deletedKeyCount = 0;
    const keysToDelete: any[] = [];
    
    keysSnapshot.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toMillis() || 0;
      if (createdAt < thirtyDaysAgo) {
        keysToDelete.push(doc);
        deletedKeyCount++;
      }
    });

    if (keysToDelete.length > 0) {
      await commitInChunks(keysToDelete, (batch, doc) => batch.delete(doc.ref));
      log.actionsPerformed.push(`Removed ${deletedKeyCount} unused activation keys older than 30 days.`);
      log.fixesApplied.push("Cleaned up unused activation keys.");
    }

    // 4. Cleanup expired activation codes (older than 24 hours)
    const codesSnapshot = await db.collection("activationCodes").get();
    let deletedCodeCount = 0;
    const codesToDelete: any[] = [];
    
    codesSnapshot.forEach(doc => {
      const data = doc.data();
      const expiresAt = data.expirationTime?.toMillis();
      if (expiresAt && expiresAt < now) {
        codesToDelete.push(doc);
        deletedCodeCount++;
      }
    });
    
    if (codesToDelete.length > 0) {
      await commitInChunks(codesToDelete, (batch, doc) => batch.delete(doc.ref));
      log.actionsPerformed.push(`Removed ${deletedCodeCount} expired activation codes.`);
    }

  } catch (error: any) {
    console.error("Maintenance Error:", error);
    log.errorsFound.push(error.message || "Unknown error during maintenance");
  } finally {
    await db.collection("maintenanceLogs").add(log);
    console.log("Automated maintenance completed.");
  }
}

async function runNotifications() {
  console.log("Starting automated notifications...");
  const now = Date.now();
  const tomorrow = now + (24 * 60 * 60 * 1000);
  const threeDaysFromNow = now + (3 * 24 * 60 * 60 * 1000);

  try {
    // 1. Upcoming Seminar Notifications
    const seminarsSnapshot = await db.collection("seminars")
      .where("status", "==", "scheduled")
      .where("notificationsSent", "==", false)
      .get();

    const activeSubsSnapshot = await db.collection("subscriptions").where("status", "==", "active").get();
    const activeEmails = activeSubsSnapshot.docs.map(doc => doc.data().email);

    for (const seminarDoc of seminarsSnapshot.docs) {
      const seminar = seminarDoc.data();
      const startTime = seminar.startTime?.toMillis();

      if (startTime && startTime > now && startTime < tomorrow) {
        console.log(`Sending notifications for seminar: ${seminar.title}`);
        
        const emailPromises = activeEmails.map(async (email) => {
          const mailOptions = {
            from: '"LFD Services" <info.lfdservice@gmail.com>',
            to: email,
            subject: `Upcoming Seminar: ${seminar.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #064e3b;">Upcoming Seminar Alert!</h2>
                <p>Hello,</p>
                <p>We are excited to invite you to our upcoming seminar:</p>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #064e3b;">${seminar.title}</h3>
                  <p><strong>Date:</strong> ${new Date(startTime).toLocaleString()}</p>
                  <p><strong>Speaker:</strong> ${seminar.speaker || 'Expert Guest'}</p>
                  <p>${seminar.description || ''}</p>
                </div>
                <p>Don't miss out on this opportunity to learn and grow with us!</p>
                <a href="https://optimal-healthcare.vercel.app/live-seminars" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Access Live Seminar</a>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 14px; color: #94a3b8;">Best regards,<br />LFD Services</p>
              </div>
            `
          };
          try {
            await transporter.sendMail(mailOptions);
          } catch (e) {
            console.error(`Failed to send seminar notification to ${email}:`, e);
          }
        });
        
        await Promise.all(emailPromises);
        await seminarDoc.ref.update({ notificationsSent: true });
      }
    }

    // 2. Subscription Renewal Notifications
    const expiringSubsSnapshot = await db.collection("subscriptions")
      .where("status", "==", "active")
      .get();

    const renewalPromises = expiringSubsSnapshot.docs.map(async (subDoc) => {
      const sub = subDoc.data();
      const expiry = sub.expiryDate?.toMillis();

      if (expiry && expiry > now && expiry < threeDaysFromNow) {
        // Check if we already sent a renewal notice
        if (!sub.renewalNoticeSent) {
          console.log(`Sending renewal notice to: ${sub.email}`);
          const mailOptions = {
            from: '"LFD Services" <info.lfdservice@gmail.com>',
            to: sub.email,
            subject: "Your Subscription is Expiring Soon",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #991b1b;">Subscription Renewal Reminder</h2>
                <p>Hello ${sub.name},</p>
                <p>Your <strong>${sub.planType}</strong> subscription is set to expire on <strong>${new Date(expiry).toLocaleDateString()}</strong>.</p>
                <p>To ensure uninterrupted access to our premium health seminars and resources, please renew your subscription today.</p>
                <a href="https://optimal-healthcare.vercel.app/seminars" style="display: inline-block; background-color: #064e3b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Renew Subscription</a>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 14px; color: #94a3b8;">Best regards,<br />LFD Services</p>
              </div>
            `
          };
          try {
            await transporter.sendMail(mailOptions);
            await subDoc.ref.update({ renewalNoticeSent: true });
          } catch (e) {
            console.error(`Failed to send renewal notice to ${sub.email}:`, e);
          }
        }
      }
    });
    await Promise.all(renewalPromises);

    // 3. New Content Announcements
    const newContentSnapshot = await db.collection("content")
      .where("notificationsSent", "==", false)
      .limit(1)
      .get();

    if (!newContentSnapshot.empty) {
      const contentDoc = newContentSnapshot.docs[0];
      const content = contentDoc.data();
      console.log(`Sending notifications for new content: ${content.title}`);

      const contentPromises = activeEmails.map(async (email) => {
        const mailOptions = {
          from: '"LFD Services" <info.lfdservice@gmail.com>',
          to: email,
          subject: `New Content Added: ${content.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #064e3b;">New Health Resource Available!</h2>
              <p>Hello,</p>
              <p>We've just added a new <strong>${content.type}</strong> to our platform:</p>
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #064e3b;">${content.title}</h3>
                <p>${content.description || ''}</p>
              </div>
              <p>Log in now to check it out!</p>
              <a href="https://optimal-healthcare.vercel.app" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View New Content</a>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 14px; color: #94a3b8;">Best regards,<br />LFD Services</p>
            </div>
          `
        };
        try {
          await transporter.sendMail(mailOptions);
        } catch (e) {
          console.error(`Failed to send content notification to ${email}:`, e);
        }
      });
      await Promise.all(contentPromises);
      await contentDoc.ref.update({ notificationsSent: true });
    }

  } catch (error: any) {
    console.error("Notification System Error:", error);
  } finally {
    console.log("Automated notifications completed.");
  }
}

cron.schedule('0 0 1 * *', () => {
  runMaintenance();
});

cron.schedule('0 9 * * *', () => {
  runNotifications();
});

// ============================================================================
// API Server Setup
// ============================================================================
async function startServer() {
  console.log("NODE_ENV:", process.env.NODE_ENV);
  const app = express();
  const PORT = 3000;

  app.use(helmet({
    contentSecurityPolicy: false,
    frameguard: false,
  }));
  app.use(express.json());
  app.use("/api/", apiLimiter);

  // Root Health Check
  app.get("/health", (req, res) => {
    logger.info("Health check requested");
    return res.status(200).send("OK");
  });

  // API Health Check
  app.get("/api/health", (req, res) => {
    logger.info("API health check requested");
    return sendResponse(res, 200, { success: true, message: "System operational" });
  });

  // DB Test
  app.get("/api/test-db", async (req, res) => {
    logger.info("DB test requested");
    try {
      const snapshot = await db.collection("test").limit(1).get();
      return sendResponse(res, 200, { success: true, message: "DB connected", data: { count: snapshot.size } });
    } catch (error: any) {
      logger.error("DB test failed", error);
      return sendResponse(res, 500, { success: false, message: "DB error", error: { code: "DB_ERROR", details: error.message } });
    }
  });

  // --------------------------------------------------------------------------
  // Subscriptions API
  // --------------------------------------------------------------------------
  const subscriptionSchema = z.object({
    userId: z.string(),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    planType: z.enum(['monthly', 'yearly']),
    paymentMethod: z.string().optional()
  });

  app.post("/api/subscriptions", verifyToken, async (req, res) => {
    try {
      const validation = subscriptionSchema.safeParse(req.body);
      if (!validation.success) {
        return sendResponse(res, 400, {
          success: false,
          message: "Invalid input",
          error: { code: "VALIDATION_ERROR", details: validation.error.format() }
        });
      }

      const { userId, name, email, phone, location, planType, paymentMethod } = validation.data;

      // Check for duplicate active subscription
      const activeSubCheck = await db.collection("subscriptions")
        .where("userId", "==", userId)
        .where("status", "==", "active")
        .get();

      if (!activeSubCheck.empty) {
        return sendResponse(res, 400, {
          success: false,
          message: "User already has an active subscription",
          error: { code: "DUPLICATE_SUBSCRIPTION" }
        });
      }

      // Create subscription
      const subRef = await db.collection("subscriptions").add({
        userId,
        name,
        email,
        phone: phone || null,
        location: location || null,
        planType,
        paymentMethod: paymentMethod || "manual",
        status: "pending",
        createdAt: FieldValue.serverTimestamp()
      });

      // Trigger initial activation code delivery (with retry system)
      processSubscriptionRetry(userId, subRef.id, 1);

      return sendResponse(res, 201, {
        success: true,
        message: "Subscription initiated. Activation code will be sent shortly.",
        data: { subscriptionId: subRef.id }
      });

    } catch (error: any) {
      console.error("Subscription Error:", error);
      return sendResponse(res, 500, {
        success: false,
        message: "Failed to process subscription",
        error: { code: "INTERNAL_SERVER_ERROR", details: error.message }
      });
    }
  });

  app.get("/api/subscriptions/status", verifyToken, async (req, res) => {
    try {
      const userId = (req as any).user.uid;
      const snapshot = await db.collection("subscriptions")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (snapshot.empty) {
        return sendResponse(res, 404, {
          success: false,
          message: "No subscription found",
          error: { code: "NOT_FOUND" }
        });
      }

      return sendResponse(res, 200, {
        success: true,
        message: "Subscription status retrieved",
        data: snapshot.docs[0].data()
      });
    } catch (error: any) {
      return sendResponse(res, 500, {
        success: false,
        message: "Error fetching status",
        error: { code: "INTERNAL_SERVER_ERROR" }
      });
    }
  });

  // --------------------------------------------------------------------------
  // Activations API
  // --------------------------------------------------------------------------
  app.post("/api/activations", verifyToken, async (req, res) => {
    try {
      const { code } = req.body;
      const userId = (req as any).user.uid;

      if (!code) {
        return sendResponse(res, 400, {
          success: false,
          message: "Activation code required",
          error: { code: "MISSING_CODE" }
        });
      }

      const codesSnapshot = await db.collection("activationCodes")
        .where("userId", "==", userId)
        .where("activationStatus", "==", false)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (codesSnapshot.empty) {
        return sendResponse(res, 404, {
          success: false,
          message: "No pending activation found",
          error: { code: "NOT_FOUND" }
        });
      }

      const codeDoc = codesSnapshot.docs[0];
      const codeData = codeDoc.data();

      if (codeData.expirationTime.toMillis() < Date.now()) {
        return sendResponse(res, 400, {
          success: false,
          message: "Code expired",
          error: { code: "EXPIRED_CODE" }
        });
      }

      if (codeData.attempts >= 5) {
        return sendResponse(res, 403, {
          success: false,
          message: "Too many attempts",
          error: { code: "BRUTE_FORCE_PROTECTION" }
        });
      }

      const isValid = await bcrypt.compare(code.toUpperCase(), codeData.activationCode);
      if (!isValid) {
        await codeDoc.ref.update({ attempts: FieldValue.increment(1) });
        return sendResponse(res, 400, {
          success: false,
          message: "Invalid code",
          error: { code: "INVALID_CODE" }
        });
      }

      const expiryDate = await planTypeToExpiry(codeData.subscriptionId);
      const batch = db.batch();
      batch.update(codeDoc.ref, { activationStatus: true, activatedAt: FieldValue.serverTimestamp() });
      batch.update(db.collection("subscriptions").doc(codeData.subscriptionId), { 
        status: "active", 
        activatedAt: FieldValue.serverTimestamp(),
        expiryDate: expiryDate
      });

      await batch.commit();

      return sendResponse(res, 200, {
        success: true,
        message: "Account activated successfully"
      });

    } catch (error: any) {
      return sendResponse(res, 500, {
        success: false,
        message: "Activation failed",
        error: { code: "INTERNAL_SERVER_ERROR" }
      });
    }
  });

  // Helper for expiry
  async function planTypeToExpiry(subId: string) {
    const sub = await db.collection("subscriptions").doc(subId).get();
    const type = sub.data()?.planType;
    const now = new Date();
    if (type === 'yearly') now.setFullYear(now.getFullYear() + 1);
    else now.setMonth(now.getMonth() + 1);
    return Timestamp.fromDate(now);
  }

  // --------------------------------------------------------------------------
  // Admin API
  // --------------------------------------------------------------------------
  app.post("/api/admin/maintenance/run", verifyToken, async (req, res) => {
    if ((req as any).user.email !== "Obenmaxjr@gmail.com") {
      return sendResponse(res, 403, { success: false, message: "Forbidden", error: { code: "FORBIDDEN" } });
    }
    try {
      await runMaintenance();
      return sendResponse(res, 200, { success: true, message: "Maintenance completed" });
    } catch (error) {
      return sendResponse(res, 500, { success: false, message: "Maintenance failed", error: { code: "INTERNAL_SERVER_ERROR" } });
    }
  });

  app.post("/api/admin/notifications/run", verifyToken, async (req, res) => {
    if ((req as any).user.email !== "Obenmaxjr@gmail.com") {
      return sendResponse(res, 403, { success: false, message: "Forbidden", error: { code: "FORBIDDEN" } });
    }
    try {
      await runNotifications();
      return sendResponse(res, 200, { success: true, message: "Notifications processed" });
    } catch (error) {
      return sendResponse(res, 500, { success: false, message: "Notification processing failed", error: { code: "INTERNAL_SERVER_ERROR" } });
    }
  });

  app.get("/api/admin/retries", verifyToken, async (req, res) => {
    if ((req as any).user.email !== "Obenmaxjr@gmail.com") {
      return sendResponse(res, 403, { success: false, message: "Forbidden", error: { code: "FORBIDDEN" } });
    }
    try {
      const snapshot = await db.collection("subscriptionRetryLogs").orderBy("timestamp", "desc").limit(50).get();
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return sendResponse(res, 200, { success: true, message: "Retry logs retrieved", data: logs });
    } catch (error) {
      return sendResponse(res, 500, { success: false, message: "Failed to fetch logs", error: { code: "INTERNAL_SERVER_ERROR" } });
    }
  });

  // --------------------------------------------------------------------------
  // Vite / Static Serving
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    logger.info("Initializing Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    logger.info("Vite middleware initialized");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    logger.info(`Serving static files from: ${distPath}`);
    
    if (!fs.existsSync(distPath)) {
      logger.error(`Dist directory NOT found at: ${distPath}`);
    }

    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        logger.error(`index.html NOT found at: ${indexPath}`);
        res.status(404).send("Frontend build not found. Please run 'npm run build'.");
      }
    });
  }

  // --------------------------------------------------------------------------
  // Global Error Handling & 404
  // --------------------------------------------------------------------------
  
  // 404 Handler
  app.use((req, res) => {
    return sendResponse(res, 404, {
      success: false,
      message: "Resource not found",
      error: { code: "NOT_FOUND" }
    });
  });

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error("Unhandled Exception:", err);
    return sendResponse(res, 500, {
      success: false,
      message: "An unexpected error occurred",
      error: { 
        code: "INTERNAL_SERVER_ERROR", 
        details: process.env.NODE_ENV === 'development' ? err.message : undefined 
      }
    });
  });

  logger.info(`Starting server on port ${PORT}...`);
  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });

  // Graceful Shutdown
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info("Server closed.");
      process.exit(0);
    });
    
    // Force exit after 10s
    setTimeout(() => {
      logger.error("Forced shutdown due to timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

startServer().catch(err => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
