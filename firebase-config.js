// Firebase Configuration
// Replace these values with your Firebase project config
// Get them from: Firebase Console > Project Settings > Your apps > Web app
// 
// IMPORTANT: If you get "api-key-not-valid" error:
// 1. Go to Firebase Console: https://console.firebase.google.com/
// 2. Select your project (or create a new one)
// 3. Go to Project Settings (gear icon) > General tab
// 4. Scroll down to "Your apps" section
// 5. Click on your Web app (or create one if needed)
// 6. Copy the config values below

const firebaseConfig = {
    apiKey: "AIzaSyADWHhohaZ6a3P6ExCr5latIVQaqJ49vE4",
    authDomain: "my-first-app-ed8f8.firebaseapp.com",
    databaseURL: "https://my-first-app-ed8f8.firebaseio.com",
    projectId: "my-first-app-ed8f8",
    storageBucket: "my-first-app-ed8f8.firebasestorage.app",
    messagingSenderId: "834257866900",
    appId: "1:834257866900:web:59556b91ab13f124c5e481",
    measurementId: "G-SK6JZ35DJ4"
};

// Validate configuration
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY_HERE') {
    console.error('❌ Firebase API Key is missing or not configured!');
    console.error('Please update firebase-config.js with your Firebase project credentials.');
    console.error('Get your config from: https://console.firebase.google.com/');
}

// Initialize Firebase (will be initialized after script loads)
let firebaseApp, db;
