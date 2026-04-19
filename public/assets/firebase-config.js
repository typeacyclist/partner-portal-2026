// Trendzact Partners — Firebase Client Config
//
// IMPORTANT: these are PUBLIC Firebase client keys.
// They are safe to commit. They identify the project to Firebase Auth
// and Firestore; they do NOT authorize any action on their own.
// Real authorization comes from Firebase Security Rules + custom claims.
//
// WHERE TO GET THESE VALUES:
//   1. Go to: https://console.firebase.google.com/project/trendzact-partners-001/settings/general
//   2. Scroll to "Your apps" → if no web app exists, click "Add app" → Web
//   3. Register the app (nickname: "Partners Portal")
//   4. Firebase shows a firebaseConfig object — copy the values into this file
//
// The apiKey here is a PROJECT IDENTIFIER, not a secret.
// It's designed to be in client-side code. Do not confuse with server-side API keys.

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAiootOnEz3yrixu_l6muJASm8d7hgkX-4",
  authDomain: "trendzact-partners-001.firebaseapp.com",
  projectId: "trendzact-partners-001",
  storageBucket: "trendzact-partners-001.firebasestorage.app",
  messagingSenderId: "1000346138245",
  appId: "1:1000346138245:web:6f3f4e852418bec1f55bec",
  measurementId: "G-LG8YZFJT72"
};