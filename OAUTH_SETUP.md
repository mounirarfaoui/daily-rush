# OAuth Setup - Authorized Redirect URIs

## Common Redirect URI Formats

### For Local Development:
```
http://localhost/index.html
http://localhost:8080/index.html
http://127.0.0.1/index.html
http://localhost/
```

### For Production:
```
https://yourdomain.com/index.html
https://yourdomain.com/
https://www.yourdomain.com/index.html
```

## Provider-Specific Examples

### Google OAuth:
- Development: `http://localhost/index.html`
- Production: `https://yourdomain.com/index.html`

### GitHub OAuth:
- Development: `http://localhost/index.html`
- Production: `https://yourdomain.com/index.html`

### Microsoft/Azure AD:
- Development: `http://localhost/index.html`
- Production: `https://yourdomain.com/index.html`

## How to Find Your Current URL:

1. Open your `index.html` in a browser
2. Check the address bar - that's your redirect URI
3. Use the exact path shown in the address bar

## Notes:
- Redirect URIs must match exactly (including protocol http/https)
- Some providers don't allow `localhost` - use `127.0.0.1` instead
- Always include the full path to your HTML file
- No trailing slashes unless your file is served from root

## Current App Location:
Based on your file structure, the redirect URI would be:
- Local: `file:///C:/Users/Mounir/OneDrive/Bureau/my apps/daily rush/index.html` (not recommended for OAuth)
- Local Server: `http://localhost/daily rush/index.html` or `http://localhost:8080/index.html`

