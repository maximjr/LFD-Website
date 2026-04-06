import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import cron from "node-cron";
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const firebaseConfig = JSON.parse(fs.readFileSync(new URL('./firebase-applet-config.json', import.meta.url), 'utf8'));

const appAdmin = initializeApp({
  projectId: firebaseConfig.projectId,
});

const db = getFirestore(appAdmin, firebaseConfig.firestoreDatabaseId);

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'info.lfdservice@gmail.com',
    pass: 'your-hardcoded-password-here', // Replaced with placeholder as actual password is not available in current context
  },
});

// Helper to generate activation code
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
// Automated Maintenance System
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

    const subBatch = db.batch();
    subsSnapshot.forEach(doc => {
      const data = doc.data();
      const expiry = data.expiryDate?.toMillis();
      
      if (data.status === 'active' && expiry && expiry < now) {
        subBatch.update(doc.ref, { status: 'expired' });
        expiredCount++;
      } else if (data.status === 'expired' && expiry && expiry < thirtyDaysAgo) {
        subBatch.delete(doc.ref);
        deletedSubCount++;
      }
    });

    if (expiredCount > 0 || deletedSubCount > 0) {
      await subBatch.commit();
      if (expiredCount > 0) log.actionsPerformed.push(`Marked ${expiredCount} subscriptions as expired.`);
      if (deletedSubCount > 0) log.actionsPerformed.push(`Removed ${deletedSubCount} old expired subscriptions.`);
      log.fixesApplied.push("Updated subscription statuses and cleaned old records.");
    }

    // 3. Unused Activation Keys Cleanup
    const keysSnapshot = await db.collection("activationKeys").where("status", "==", "unused").get();
    let deletedKeyCount = 0;
    const keyBatch = db.batch();
    keysSnapshot.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toMillis() || 0;
      if (createdAt < thirtyDaysAgo) {
        keyBatch.delete(doc.ref);
        deletedKeyCount++;
      }
    });

    if (deletedKeyCount > 0) {
      await keyBatch.commit();
      log.actionsPerformed.push(`Removed ${deletedKeyCount} unused activation keys older than 30 days.`);
      log.fixesApplied.push("Cleaned up unused activation keys.");
    }

    // 4. Cleanup expired activation codes (older than 24 hours)
    const codesSnapshot = await db.collection("activationCodes").get();
    let deletedCodeCount = 0;
    const codeBatch = db.batch();
    codesSnapshot.forEach(doc => {
      const data = doc.data();
      const expiresAt = data.expirationTime?.toMillis();
      if (expiresAt && expiresAt < now) {
        codeBatch.delete(doc.ref);
        deletedCodeCount++;
      }
    });
    if (deletedCodeCount > 0) {
      await codeBatch.commit();
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

cron.schedule('0 0 1 * *', () => {
  runMaintenance();
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Subscription Endpoint
  app.post("/api/subscribe", async (req, res) => {
    const { userId, name, email, phone, location, planType, paymentMethod } = req.body;

    if (!userId || !name || !email || !planType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // 1. Create subscription in Firestore
      const subRef = await db.collection("subscriptions").add({
        userId,
        name,
        email,
        phone,
        location,
        planType,
        paymentMethod,
        status: "pending",
        createdAt: FieldValue.serverTimestamp()
      });

      // 2. Generate and Hash Activation Code
      const rawCode = generateActivationCode();
      const hashedCode = await bcrypt.hash(rawCode, 10);
      const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // 3. Store Activation Code
      await db.collection("activationCodes").add({
        userId,
        email,
        activationCode: hashedCode,
        subscriptionId: subRef.id,
        subscriptionStatus: "pending",
        activationStatus: false,
        createdAt: FieldValue.serverTimestamp(),
        expirationTime: Timestamp.fromDate(expirationTime),
        attempts: 0
      });

      // 4. Send Email
      const mailOptions = {
        from: '"LFD Services" <info.lfdservice@gmail.com>',
        to: email,
        subject: "Your LFD Service Activation Code",
        text: `Hello ${name},

Thank you for subscribing to our platform.

Your activation code is:

${rawCode}

Please enter this code on the activation page to activate your account.

This code will expire in 24 hours.

Best regards,
LFD Services`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #064e3b;">Hello ${name},</h2>
            <p>Thank you for subscribing to our platform.</p>
            <p>Your activation code is:</p>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #064e3b;">${rawCode}</span>
            </div>
            <p>Please enter this code on the activation page to activate your account.</p>
            <p style="color: #64748b; font-size: 14px;">This code will expire in 24 hours.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 14px; color: #94a3b8;">Best regards,<br />LFD Services</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      res.json({ success: true, message: "Subscription created and activation code sent." });
    } catch (error: any) {
      console.error("Subscription Error:", error);
      res.status(500).json({ error: "Failed to process subscription" });
    }
  });

  // Activation Verification Endpoint
  app.post("/api/activate", async (req, res) => {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: "Missing userId or code" });
    }

    try {
      // Find the latest activation code for this user
      const codesSnapshot = await db.collection("activationCodes")
        .where("userId", "==", userId)
        .where("activationStatus", "==", false)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (codesSnapshot.empty) {
        return res.status(404).json({ error: "No pending activation found" });
      }

      const codeDoc = codesSnapshot.docs[0];
      const codeData = codeDoc.data();

      // Check expiration
      if (codeData.expirationTime.toMillis() < Date.now()) {
        return res.status(400).json({ error: "Activation code has expired" });
      }

      // Check brute force (limit attempts)
      if (codeData.attempts >= 5) {
        return res.status(403).json({ error: "Too many failed attempts. Please request a new code." });
      }

      // Verify code
      const isValid = await bcrypt.compare(code.toUpperCase(), codeData.activationCode);
      if (!isValid) {
        await codeDoc.ref.update({ attempts: FieldValue.increment(1) });
        return res.status(400).json({ error: "Invalid activation code. Please try again." });
      }

      // Success! Update subscription and activation status
      const batch = db.batch();
      
      // Update activation code doc
      batch.update(codeDoc.ref, { 
        activationStatus: true,
        activatedAt: FieldValue.serverTimestamp()
      });

      // Update subscription doc
      const subRef = db.collection("subscriptions").doc(codeData.subscriptionId);
      batch.update(subRef, { 
        status: "active",
        activatedAt: FieldValue.serverTimestamp()
      });

      await batch.commit();

      res.json({ success: true, message: "Your account has been successfully activated." });
    } catch (error: any) {
      console.error("Activation Error:", error);
      res.status(500).json({ error: "Failed to verify activation code" });
    }
  });

  // Manual trigger for maintenance
  app.post("/api/admin/maintenance", async (req, res) => {
    try {
      await runMaintenance();
      res.json({ success: true, message: "Maintenance completed successfully." });
    } catch (error) {
      console.error("Manual maintenance trigger failed:", error);
      res.status(500).json({ success: false, message: "Maintenance failed." });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Import Timestamp from firestore for expiration check
import { Timestamp } from "firebase-admin/firestore";

startServer();
