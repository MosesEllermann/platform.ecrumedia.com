# Debugging 503 Error - Backend Running But Not Accessible

## The Problem
Your backend is running on the server (port 3146 or whatever APP_PORT is), but when you try to access `https://platform.ecrumedia.com/api/auth/login`, you get a 503 error.

This means: **The reverse proxy is NOT working**.

## Quick Diagnosis (SSH into server)

```bash
ssh site22570@YOUR_HOST -p6543

# 1. Check if backend is running
ps aux | grep "node.*dist/main.js"

# 2. Check if backend responds locally
curl http://127.0.0.1:3146/api
# Should return: "Hello from eCru Media Platform API!"

# 3. Check what Apache returns
curl -I https://platform.ecrumedia.com/api
# If 503, the proxy isn't working

# 4. Check .htaccess
cat ~/platform.ecrumedia.com/.htaccess

# 5. Check Apache error log
tail -f ~/logs/error_log
# (path may vary, try: tail -f ~/.logs/error_log or /var/log/apache2/error.log)
```

## Solution Options

### Option 1: sPanel Proxy Configuration (RECOMMENDED)

Instead of using `.htaccess`, configure the proxy in sPanel's control panel:

1. **Login to sPanel**
2. **Go to "Proxy" or "Reverse Proxy" section**
3. **Add new proxy rule:**
   - Path: `/api`
   - Target: `http://127.0.0.1:3146`
   - Or Target: `http://127.0.0.1:3146/api`

4. **Save and restart Apache**

### Option 2: Fix .htaccess with correct syntax

SSH into server and manually edit `.htaccess`:

```bash
cd ~/platform.ecrumedia.com
nano .htaccess
```

Try this simpler version:

```apache
# Enable rewrite engine
RewriteEngine On

# Proxy API requests to backend
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^(.*)$ http://127.0.0.1:3146/$1 [P,L]

# SPA fallback for everything else
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

**Save and test:** `curl -I https://platform.ecrumedia.com/api`

### Option 3: Use subdomain for API

If proxy doesn't work, create a subdomain:

1. In sPanel, create subdomain: `api.platform.ecrumedia.com`
2. Point it to `/home/site22570/platform.ecrumedia.com/backend`
3. Configure it to run your Node.js app directly
4. Update frontend to use `https://api.platform.ecrumedia.com` instead of `https://platform.ecrumedia.com/api`

Update `VITE_API_URL` in GitHub Secrets to: `https://api.platform.ecrumedia.com`

### Option 4: Check Apache Proxy Modules

The `[P]` flag requires proxy modules. Check if enabled:

```bash
# Check loaded modules
apachectl -M | grep proxy

# Should see:
# proxy_module
# proxy_http_module
```

If missing, you need to enable them (might need root or sPanel admin):

```bash
a2enmod proxy proxy_http
systemctl restart apache2
```

## Expected Behavior After Fix

```bash
# Test 1: Backend responds locally
curl http://127.0.0.1:3146/api
# ✅ Output: Hello from eCru Media Platform API!

# Test 2: Public URL works
curl https://platform.ecrumedia.com/api
# ✅ Output: Hello from eCru Media Platform API!

# Test 3: Login works
curl -X POST https://platform.ecrumedia.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
# ✅ Output: JSON response (not HTML 503 error)
```

## Check GitHub Actions Output

The deployment now includes detailed diagnostics. Check the output:

https://github.com/MosesEllermann/platform.ecrumedia.com/actions

Look for the "DIAGNOSTICS" section which will tell you exactly what's failing.

## Most Likely Solution

Based on sPanel's typical configuration, **Option 1** (using sPanel's Proxy UI) is the most reliable. The `.htaccess` proxy might be blocked by sPanel's security settings.
