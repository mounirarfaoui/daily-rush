# How to Start Local Web Server

## Problem: "localhost refused to connect"

This happens because you need a web server running. Here are several solutions:

## Solution 1: Install Python (Easiest)

1. Download Python from: https://www.python.org/downloads/
2. **IMPORTANT:** During installation, check ✅ "Add Python to PATH"
3. After installation, double-click `START_SERVER.bat`
4. Open browser to: `http://localhost:8000`

## Solution 2: Install Node.js

1. Download from: https://nodejs.org/
2. Install it
3. Double-click `START_SERVER.bat` (it will use Node.js automatically)
4. Open browser to the URL shown

## Solution 3: Use VS Code Live Server (Recommended for Development)

1. Install Visual Studio Code: https://code.visualstudio.com/
2. Open your project folder in VS Code
3. Install the "Live Server" extension (by Ritwick Dey)
4. Right-click on `index.html`
5. Select **"Open with Live Server"**
6. Browser will open automatically

## Solution 4: Manual Python Command

If Python is installed, open Command Prompt in this folder and run:
```bash
python -m http.server 8000
```
Then open: `http://localhost:8000`

## Solution 5: Use Online Code Editor

- **CodePen.io** - Upload your HTML/CSS/JS files
- **JSFiddle** - Paste your code
- **Replit** - Create a web project

## Quick Test

After starting a server, you should see:
- ✅ No "refused to connect" error
- ✅ Your app loads normally
- ✅ Google Sign-In button appears (if using http://)

## Troubleshooting

**Port already in use?**
- Try a different port: `python -m http.server 8080`
- Or kill the process using port 8000

**Still not working?**
- Make sure you're using `http://localhost:8000` not `file://`
- Check Windows Firewall isn't blocking it
- Try `http://127.0.0.1:8000` instead

## Note About Google Sign-In

If you're using Google Sign-In, you MUST use a web server (not file://). The app will work without login, but Google Sign-In requires http:// or https://.

