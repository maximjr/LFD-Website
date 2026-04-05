import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import sgMail from "@sendgrid/mail";

admin.initializeApp();

// Initialize SendGrid API Key from environment variables
// Make sure to set this using: firebase functions:config:set sendgrid.key="YOUR_API_KEY"
// Or use process.env.SENDGRID_API_KEY if using dotenv in functions
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || functions.config().sendgrid?.key;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export const sendActivationEmail = functions.firestore
  .document("activationKeys/{docId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();

    // 3. FIRESTORE DATA VALIDATION
    // Prevent execution if missing essential fields
    if (!data.email || !data.key) {
      console.log("Missing email or key. Skipping email delivery.");
      return null;
    }

    // 5. DUPLICATE PREVENTION BUG
    // Ensure this logic DOES NOT block first send
    if (data.emailSent === true) {
      console.log("Email already sent. Skipping.");
      return null;
    }

    // 2. SENDGRID CONFIGURATION
    console.log("Sending email to:", data.email);

    if (!SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY is not set. Cannot send email.");
      return null;
    }

    const SENDER_EMAIL = process.env.SENDGRID_SENDER_EMAIL || functions.config().sendgrid?.sender || "no-reply@optimalhealthcare.com";

    const msg = {
      to: data.email,
      from: SENDER_EMAIL,
      subject: "Your Activation Key - Optimal Healthcare",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; padding: 40px; color: #334155;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            
            <div style="background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">Optimal Healthcare</h1>
            </div>

            <div style="padding: 40px; text-align: center;">
              <h2 style="color: #0f172a; margin-bottom: 16px; font-size: 24px; font-weight: 700;">Your Activation Key</h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                Welcome to the premium seminar experience. Use the unique key below to unlock your access.
              </p>

              <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 16px; padding: 30px; margin-bottom: 32px; display: inline-block; min-width: 250px;">
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #064e3b; letter-spacing: 6px;">
                  ${data.key}
                </div>
              </div>

              <div style="margin-bottom: 32px;">
                <p style="margin: 0; color: #475569; font-size: 16px;">
                  <strong>Plan:</strong> <span style="text-transform: capitalize; color: #064e3b;">${data.plan || 'Standard'}</span>
                </p>
              </div>

              <a href="https://optimalhealthcare.com/seminars"
                 style="display: inline-block; padding: 16px 32px; background-color: #064e3b; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; transition: background-color 0.2s;">
                 Activate Now
              </a>
            </div>

            <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Optimal Healthcare. All rights reserved.<br />
                If you didn't request this key, please ignore this email.
              </p>
            </div>

          </div>
        </div>
      `
    };

    // 4. ERROR HANDLING (CRITICAL FIX)
    try {
      await sgMail.send(msg);
      console.log("Email sent");
      
      // 6. FIRESTORE UPDATE AFTER SEND
      await snap.ref.update({
        emailSent: true,
        emailStatus: "sent",
        emailSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
    } catch (error: any) {
      console.error("SendGrid Error:", error.response?.body || error);
      
      // Update status to failed so we know it didn't send
      await snap.ref.update({
        emailStatus: "failed",
        emailError: error.message || "Unknown error"
      });
    }
    
    return null;
  });

// Optional Auto Cleanup: Scheduled function to permanently delete records soft-deleted for more than 30 days
export const cleanupDeletedUsers = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

    console.log(`Starting cleanup of records deleted before ${thirtyDaysAgo.toISOString()}`);

    const db = admin.firestore();
    const batch = db.batch();
    let deleteCount = 0;

    try {
      // Find subscriptions soft-deleted more than 30 days ago
      const subsSnapshot = await db.collection("subscriptions")
        .where("deleted", "==", true)
        .where("deletedAt", "<=", thirtyDaysAgoTimestamp)
        .get();

      for (const doc of subsSnapshot.docs) {
        batch.delete(doc.ref);
        deleteCount++;
        
        // Also find and delete associated activation keys
        const keysSnapshot = await db.collection("activationKeys")
          .where("userId", "==", doc.data().userId)
          .get();
          
        for (const keyDoc of keysSnapshot.docs) {
          batch.delete(keyDoc.ref);
          deleteCount++;
        }
      }

      if (deleteCount > 0) {
        await batch.commit();
        console.log(`Successfully permanently deleted ${deleteCount} records.`);
      } else {
        console.log("No records found for cleanup.");
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }

    return null;
  });
