# 🔧 Fix Google Login - Step by Step Guide

## Current Setup:
- **App URL**: `http://localhost:8000`
- **Client ID**: `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com` (Configure in `script.js`)

## Step 1: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** > **OAuth consent screen**
4. Configure:
   - **User Type**: Choose **External** (unless you have Google Workspace)
   - **App name**: `Daily Rush`
   - **User support email**: Select your email (`m.mounirarfaoui@gmail.com`)
   - **Developer contact information**: Enter `m.mounirarfaoui@gmail.com`
   - Click **Save and Continue**
5. **Scopes** (Step 2):
   - Click **Save and Continue** (default scopes are fine)
6. **Test users** (Step 3) - **IMPORTANT!**:
   - Click **+ ADD USERS**
   - Enter: `m.mounirarfaoui@gmail.com`
   - Click **ADD**
   - Click **Save and Continue**
7. **Summary** (Step 4):
   - Review and go back to **Credentials**

## Step 2: Add Redirect URIs

1. Still in Google Cloud Console
2. Go to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID (the one with your Client ID)
4. Click on it to edit
5. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
   ```
   http://localhost:8000
   http://127.0.0.1:8000
   ```
6. Under **Authorized redirect URIs**, click **+ ADD URI** and add:
   ```
   http://localhost:8000
   http://localhost:8000/
   http://127.0.0.1:8000
   http://127.0.0.1:8000/
   ```
7. Click **SAVE**

## Step 3: Wait and Test

1. Wait 1-2 minutes for changes to propagate
2. Refresh your app at `http://localhost:8000`
3. Click the **Login** button (person icon in top-right)
4. Click **Sign in with Google**
5. It should work now! ✅

## Common Issues:

### Issue: "Access blocked: Authorization Error"
**Fix**: You're missing from test users list
- Go to **OAuth consent screen** > **Test users**
- Add `m.mounirarfaoui@gmail.com`

### Issue: "redirect_uri_mismatch"
**Fix**: URI not added correctly
- Make sure you added `http://localhost:8000` (with port!)
- Must match EXACTLY (no trailing slash or different port)

### Issue: Still not working after changes
**Fix**: Clear browser cache
- Press `Ctrl + Shift + Delete`
- Clear cached images and files
- Refresh the page

## Quick Checklist:

- [ ] OAuth consent screen configured
- [ ] App name: "Daily Rush"
- [ ] Support email added
- [ ] Test user `m.mounirarfaoui@gmail.com` added
- [ ] Authorized JavaScript origin: `http://localhost:8000`
- [ ] Authorized redirect URI: `http://localhost:8000`
- [ ] All changes saved
- [ ] Waited 1-2 minutes
- [ ] Browser cache cleared
- [ ] Server running on port 8000

## Need Help?

The app will show helpful error messages if something is wrong. Look at the login modal for specific instructions.

