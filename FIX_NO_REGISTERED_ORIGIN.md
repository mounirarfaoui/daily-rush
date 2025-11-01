# 🔧 Fix "no registered origin" / Error 401: invalid_client

## Problem:
You're seeing: **"no registered origin"** or **"Error 401: invalid_client"**

This means: The JavaScript origin (where your app is running) is NOT registered in Google Cloud Console.

## ✅ SOLUTION - Step by Step:

### Step 1: Open Google Cloud Console
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your project
3. Find your OAuth 2.0 Client ID (the one with Client ID: `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com`)
4. **Click on it** to edit

### Step 2: Add Authorized JavaScript Origins ⚠️ CRITICAL!
This is what's missing and causing the error!

1. Scroll down to **"Authorized JavaScript origins"**
2. Click **+ ADD URI**
3. Add this EXACT URL:
   ```
   http://localhost:8000
   ```
4. Click the **+ ADD URI** button again
5. Add this second URL:
   ```
   http://127.0.0.1:8000
   ```
6. **Important:** Make sure both URLs are added and saved!

### Step 3: Add Authorized Redirect URIs
1. Scroll down to **"Authorized redirect URIs"**
2. Click **+ ADD URI**
3. Add:
   ```
   http://localhost:8000
   ```
4. Click **+ ADD URI** again
5. Add:
   ```
   http://localhost:8000/
   ```
6. Click **+ ADD URI** again
7. Add:
   ```
   http://127.0.0.1:8000
   ```

### Step 4: Save
1. Scroll to the bottom
2. Click **SAVE**

### Step 5: Wait and Test
1. **Wait 1-2 minutes** for changes to propagate
2. Refresh your app at `http://localhost:8000`
3. Try logging in again

## Visual Guide:

In Google Cloud Console, you should see:

**Authorized JavaScript origins:**
```
http://localhost:8000
http://127.0.0.1:8000
```

**Authorized redirect URIs:**
```
http://localhost:8000
http://localhost:8000/
http://127.0.0.1:8000
```

## Common Mistakes:

❌ **WRONG:** Adding only `http://localhost` (missing port)  
✅ **CORRECT:** `http://localhost:8000` (with port!)

❌ **WRONG:** Adding `https://localhost:8000` (wrong protocol)  
✅ **CORRECT:** `http://localhost:8000` (use http for local)

❌ **WRONG:** Not clicking SAVE after adding URIs  
✅ **CORRECT:** Always click SAVE at the bottom!

## Still Not Working?

1. Clear browser cache: `Ctrl + Shift + Delete`
2. Make sure you're accessing `http://localhost:8000` (not file://)
3. Make sure the server is running
4. Wait a few more minutes - Google can take time to update
5. Try a different browser or incognito mode

