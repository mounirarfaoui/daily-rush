# 🔧 Fix Error 401: invalid_client - Complete Guide

## What This Error Means:
"Error 401: invalid_client" means Google cannot validate your OAuth client. This is usually because:
1. **Authorized JavaScript origins are missing** (most common!)
2. Client ID is incorrect
3. Application type is wrong in Google Console

## ✅ Complete Fix Steps:

### Step 1: Verify Your Client ID
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Make sure it matches: `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com`
4. Click on it to edit

### Step 2: Check Application Type ⚠️
1. In the OAuth client details, check "Application type"
2. It MUST be set to **"Web application"**
3. If it's not, you need to create a new OAuth client with type "Web application"

### Step 3: Add Authorized JavaScript Origins (CRITICAL!)
**This is what's missing! You MUST have this!**

1. In the OAuth client edit page
2. Scroll to **"Authorized JavaScript origins"**
3. Click **+ ADD URI**
4. Add EXACTLY:
   ```
   http://localhost:8000
   ```
5. Click the **+ ADD URI** button again (add another one)
6. Add:
   ```
   http://127.0.0.1:8000
   ```
7. **Both must be listed!**

### Step 4: Add Authorized Redirect URIs
1. Scroll to **"Authorized redirect URIs"**
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

### Step 5: Save and Wait
1. Click **SAVE** at the bottom
2. **Wait 2-3 minutes** for changes to propagate
3. Clear browser cache (Ctrl + Shift + Delete)
4. Refresh your app

### Step 6: Verify OAuth Consent Screen
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Make sure:
   - App is published OR in testing mode
   - If in testing mode, you're added as a test user
   - App name is set

## Quick Checklist:

✅ Client ID matches: `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com`  
✅ Application type: **Web application**  
✅ Authorized JavaScript origins: `http://localhost:8000` AND `http://127.0.0.1:8000`  
✅ Authorized redirect URIs: At least `http://localhost:8000`  
✅ Changes saved  
✅ Waited 2-3 minutes  
✅ Browser cache cleared  
✅ OAuth consent screen configured  

## Still Not Working?

**Option 1: Create New OAuth Client (if Application type is wrong)**
1. Go to Credentials
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Application type: **Web application**
4. Name: "Daily Rush"
5. Authorized JavaScript origins: `http://localhost:8000`
6. Authorized redirect URIs: `http://localhost:8000`
7. Click **CREATE**
8. Copy the new Client ID
9. Update `script.js` with the new Client ID

**Option 2: Double-check everything**
- Make sure you're using `http://` not `https://`
- Make sure port `:8000` is included
- No trailing spaces in the URLs
- Clicked SAVE after adding URIs

