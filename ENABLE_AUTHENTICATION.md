# Enable Authentication in Firebase

## Quick Fix: Enable Email/Password Authentication

You're seeing this error because Email/Password authentication is not enabled in your Firebase project. Here's how to enable it:

### Step-by-Step Instructions

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Select Your Project**
   - Click on your project name (e.g., "my-first-app-ed8f8")

3. **Navigate to Authentication**
   - In the left sidebar, click on **"Authentication"**
   - If you see "Get started", click it (this is your first time setting up authentication)

4. **Enable Email/Password**
   - Click on the **"Sign-in method"** tab at the top
   - You'll see a list of sign-in providers
   - Find **"Email/Password"** in the list
   - Click on it

5. **Enable the Provider**
   - Toggle **"Enable"** to ON (or click "Enable" button)
   - You can leave "Email link (passwordless sign-in)" disabled for now
   - Click **"Save"**

6. **Enable Google Sign-In (if using)**
   - In the same "Sign-in method" tab
   - Click on **"Google"**
   - Toggle **"Enable"** to ON
   - Add a **Support email** (your email address)
   - Add a **Project support email** (same email)
   - Click **"Save"**

7. **Verify**
   - You should now see "Email/Password" and "Google" marked as "Enabled"
   - Refresh your browser and try signing in/signing up again

## Visual Guide

```
Firebase Console
├── Your Project
    ├── Authentication (left sidebar)
        ├── Users (tab)
        ├── Sign-in method (tab) ← CLICK HERE
            ├── Email/Password ← CLICK HERE
                ├── Enable: ON ← TURN THIS ON
                └── Save ← CLICK SAVE
```

## Common Issues

### "I don't see Authentication in the sidebar"
- Make sure you've selected a Firebase project
- Some projects need to be upgraded to the Blaze (pay-as-you-go) plan for certain features, but Authentication should work on the free Spark plan

### "I see 'Get started' button"
- Click "Get started" - this initializes Authentication for your project
- Then follow steps 4-6 above

### "Enable button is grayed out"
- Make sure you're the project owner or have the right permissions
- Try refreshing the page

### "Google Sign-In shows configuration needed"
- For Google Sign-In, you need to:
  1. Configure OAuth consent screen in Google Cloud Console
  2. Add authorized JavaScript origins
  3. See `GOOGLE_AUTH_SETUP.md` for detailed instructions

## After Enabling

Once you've enabled Email/Password authentication:
1. **Refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. Try signing up with a new account
3. Try signing in with an existing account

The error should be gone!

## Still Having Issues?

1. **Check the browser console** (F12) for any other error messages
2. **Make sure your Firebase config is correct** in `firebase-config.js`
3. **Verify you're using the right Firebase project** (check projectId in firebase-config.js)

## Need More Help?

- Firebase Documentation: https://firebase.google.com/docs/auth
- Firebase Support: https://firebase.google.com/support

