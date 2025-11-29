# FINAL SOLUTION: Configure Reverse Proxy in sPanel

## Current Status
- ✅ Frontend: Working at https://platform.ecrumedia.com
- ✅ Backend: Running on port 3146
- ❌ API Proxy: NOT configured (causing 503 error on login)

## The Problem
`.htaccess` cannot configure reverse proxy on sPanel. You MUST use sPanel's control panel.

## Solution: Configure Proxy in sPanel

### Step 1: Login to sPanel
Go to your sPanel control panel

### Step 2: Find Proxy Configuration
Look for one of these sections:
- "Reverse Proxy"
- "Proxy"  
- "Web Applications" → "Proxy"
- "Apache Configuration" → "Reverse Proxy"

### Step 3: Add Proxy Rule
Click "Add New Proxy" or "Create Proxy Rule" and fill in:

```
Source Path: /api
Target URL: http://127.0.0.1:3146
or
Target URL: http://127.0.0.1:3146/api
```

**Try both target URLs** - one should work!

### Step 4: Save and Test
1. Save the proxy rule
2. Wait 10-30 seconds
3. Test: https://platform.ecrumedia.com/api
4. Should return: "Hello from eCru Media Platform API!"

### Step 5: Try Logging In
Go to https://platform.ecrumedia.com and try to login

---

## Alternative: If sPanel Doesn't Have Proxy UI

If you can't find reverse proxy settings in sPanel, contact sPanel support and ask:

> "How do I configure a reverse proxy from /api to http://127.0.0.1:3146? 
> I need API requests at https://platform.ecrumedia.com/api to proxy to my Node.js backend running on port 3146."

They will either:
1. Enable proxy for you
2. Tell you where to find the setting
3. Provide a different method (like editing httpd.conf)

---

## Quick Test Commands

SSH into your server and run:

```bash
# Test 1: Backend is running locally
curl http://127.0.0.1:3146/api
# Expected: "Hello from eCru Media Platform API!"

# Test 2: Public URL (after proxy is configured)
curl https://platform.ecrumedia.com/api  
# Expected: "Hello from eCru Media Platform API!"
# Currently: 503 error (no proxy)
```

---

## What Port Is My Backend On?

Check your GitHub Secrets:
https://github.com/MosesEllermann/platform.ecrumedia.com/settings/secrets/actions

Look for `APP_PORT` - use that value in the proxy configuration.

---

## After Proxy Is Configured

Your app will work perfectly:
- Frontend: https://platform.ecrumedia.com
- API: https://platform.ecrumedia.com/api (proxied to backend)
- Login will work ✅
- All API calls will work ✅
