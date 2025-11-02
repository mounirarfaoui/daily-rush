# Fix Firebase API Key Error

If you're seeing the error: **"Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)"**, follow these steps:

## Quick Fix Steps

### 1. Go to Firebase Console
Visit: https://console.firebase.google.com/

### 2. Select or Create Your Project
- If you don't have a project, click "Add project" and create one
- If you have a project, select it from the list

### 3. Get Your Firebase Configuration
1. Click the **gear icon** (⚙️) next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to the **"Your apps"** section
4. If you don't have a Web app yet:
   - Click **"</>"** (Web icon) to add a Web app
   - Give it a nickname (e.g., "Daily Rush")
   - Click **"Register app"**
5. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### 4. Update firebase-config.js
1. Open `firebase-config.js` in your project
2. Replace the values with the ones you copied from Firebase Console
3. Save the file
4. Refresh your browser

### 5. Enable Authentication Methods

#### Enable Email/Password Authentication:
1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **"Get started"** if this is your first time
3. Click the **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Enable **"Email/Password"** (toggle ON)
6. Click **"Save"**

#### Enable Google Sign-In (if using):
1. In the same "Sign-in method" tab
2. Click on **"Google"**
3. Enable it and add your support email
4. Click **"Save"**

### 6. Check API Key Restrictions (if still not working)
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Select your Firebase project
3. Go to **APIs & Services** > **Credentials**
4. Find your API key (starts with "AIza...")
5. Click on it
6. Check if there are any **API restrictions** or **Application restrictions**
7. Make sure:
   - **API restrictions**: Either "Don't restrict key" OR includes "Firebase Authentication API"
   - **Application restrictions**: Either "None" OR includes your domain (localhost is allowed)

## Verify It's Working

After updating the config:
1. Open your browser's Developer Console (F12)
2. Look for: `✅ Firebase initialized successfully`
3. Try signing in/signing up - the error should be gone!

## Still Having Issues?

### Check These Common Problems:

1. **API Key was deleted/revoked**
   - Create a new Web app in Firebase Console
   - Get a new API key

2. **Wrong project selected**
   - Make sure you're using the config from the correct Firebase project

3. **Firebase SDK not loaded**
   - Check that these scripts are in your `index.html`:
   ```html
   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
   ```

4. **Browser cache**
   - Clear your browser cache or do a hard refresh (Ctrl+Shift+R)

## Need More Help?

Check the browser console for detailed error messages. They will help identify the specific issue.

