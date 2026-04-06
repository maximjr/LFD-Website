import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Fallback to empty app if initialization fails to prevent total crash
  app = getApps()[0] || {} as any;
}
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || "(default)");

// Connection Test
async function testConnection() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("TODO")) {
    console.warn("Firebase configuration is incomplete. Please check firebase-applet-config.json");
    return;
  }
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if(error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();
