# Google Authentication Setup

## ⚠️ IMPORTANT: You MUST Use a Web Server

**Google OAuth DOES NOT work with `file://` protocol!**

You must run a local web server. Here's how:

### Quick Start - Local Server:

**Option 1: Python (Recommended)**
```bash
cd "C:\Users\Mounir\OneDrive\Bureau\my apps\daily rush"
python -m http.server 8000
```
Then open: `http://localhost:8000`

**Option 2: Node.js**
```bash
cd "C:\Users\Mounir\OneDrive\Bureau\my apps\daily rush"
npx serve
```

**Option 3: PHP**
```bash
cd "C:\Users\Mounir\OneDrive\Bureau\my apps\daily rush"
php -S localhost:8000
```

## Authorized Redirect URIs

You need to add these redirect URIs in your Google Cloud Console:

### For Local Development (After Starting Server):
```
http://localhost:8000
http://localhost:8000/
http://localhost:8000/index.html
http://localhost
http://localhost/
http://localhost/index.html
```

### For Production (replace with your actual domain):
```
https://yourdomain.com
https://yourdomain.com/
https://www.yourdomain.com
https://www.yourdomain.com/
```

## How to Configure in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, click **Add URI**
6. Add all the URIs listed above (for your environment)
7. Click **Save**

## Current Configuration:

- **Client ID**: `YOUR_CLIENT_ID_HERE` (Configure in `script.js`)
- **Client Secret**: `YOUR_CLIENT_SECRET_HERE` (Note: **NOT used in client-side OAuth**, keep this private)

### ⚠️ Important Security Note:
- The **Client Secret is NEVER used** in client-side JavaScript code
- It's only needed for **server-side** OAuth flows
- Keep it secure and never expose it in your frontend code
- For this app, only the **Client ID** is needed (already configured)

## Important Notes:

- The client secret is NOT used in client-side OAuth (JavaScript)
- For client-side apps, only the Client ID is needed
- Make sure your redirect URIs match exactly (including http/https and trailing slashes)
- Google may require verified domains for production URLs

## Testing:

1. Open your `index.html` file in a browser
2. You should see a login modal
3. Click "Sign in with Google"
4. After authentication, the modal will close and your profile will appear in the top bar

## Troubleshooting:

### Error 400: invalid_request
**Cause:** Redirect URI not configured or app not served over HTTP/HTTPS

**Solution:**
1. ✅ Make sure you're using a web server (NOT opening file:// directly)
2. ✅ Add the exact URL you're using to Google Console redirect URIs
3. ✅ The redirect URI must match EXACTLY (including port number)
4. ✅ Wait a few minutes after saving - changes may take time to propagate

### "Access blocked: Authorization Error"
**Cause:** OAuth consent screen not configured or app in restricted testing mode

**Solution:**
1. Go to **APIs & Services** > **OAuth consent screen**
2. Configure the consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in App name: "Daily Rush"
   - Add your email as support email
   - Add your email as developer contact
   - Click **Save and Continue**
3. Add test users:
   - Go to **Test users**
   - Click **Add Users**
   - Add your email: `m.mounirarfaoui@gmail.com`
   - Click **Add**

### "redirect_uri_mismatch"
**Solution:** 
- Copy the exact URL from your browser address bar
- Add it to Google Console redirect URIs (must match exactly)

### "popup_closed_by_user"
**Note:** This is normal - the user closed the popup window.

### Script not loading
**Solution:** Check your internet connection and that you can access Google's servers.

