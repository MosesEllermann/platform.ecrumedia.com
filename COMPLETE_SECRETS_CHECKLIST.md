# ✅ Complete GitHub Secrets Checklist

## 🚨 IMPORTANT: ALL These Secrets Must Be Set for Deployment to Work!

Go to: https://github.com/mosesellermann/platform.ecrumedia.com/settings/secrets/actions

---

## Server Connection Secrets (4 required)

### ✅ SERVER_HOST
```
Value: ecrumedia.com
OR:    78.46.76.56
```

### ✅ SERVER_PORT  
```
Value: 6543
```

### ✅ SERVER_USER
```
Value: site22570
```

### ✅ SERVER_PASSWORD
```
Value: [Your sPanel SSH password]
```

---

## Database Secret (1 required)

### ✅ DATABASE_URL
```
Value: mysql://site22570_moses:LIni05IhzDlpz@localhost:3306/site22570_ecrumedia_platform
```

**⚠️ CRITICAL:** This is the EXACT value from your DEPLOY_SPANEL.txt file.

---

## Application Secrets (2 required)

### ✅ JWT_SECRET
```
Value: 59bbfdeb40f027c06663244e3ef24f5d38d40f3a08907cfea6ca7203fa08bc10
```

**Note:** You can generate a new one with: `openssl rand -hex 32`

### ✅ APP_PORT
```
Value: 3146
```

**⚠️ IMPORTANT:** This is the port sPanel assigned to your Node.js app. 
Check in sPanel Node.js Manager to confirm the port number.

---

## Email Secrets (5 required)

### ✅ EMAIL_HOST
```
Value: smtp.hosttech.eu
(or your SMTP server hostname)
```

### ✅ EMAIL_PORT
```
Value: 587
(or 465 for SSL)
```

### ✅ EMAIL_USER
```
Value: noreply@ecrumedia.com
(or your email username)
```

### ✅ EMAIL_PASSWORD
```
Value: [Your email/SMTP password]
```

### ✅ EMAIL_FROM
```
Value: "ECRU Media Platform" <noreply@ecrumedia.com>
```

---

## Quick Setup Commands

### Step 1: Go to GitHub Secrets
```
https://github.com/mosesellermann/platform.ecrumedia.com/settings/secrets/actions
```

### Step 2: Add Each Secret
For each secret above:
1. Click "New repository secret"
2. Enter the **Name** (e.g., `DATABASE_URL`)
3. Enter the **Value** (copy from above)
4. Click "Add secret"

### Step 3: Verify All Secrets Are Set
You should have **12 secrets total**:
- [ ] SERVER_HOST
- [ ] SERVER_PORT
- [ ] SERVER_USER
- [ ] SERVER_PASSWORD
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] APP_PORT
- [ ] EMAIL_HOST
- [ ] EMAIL_PORT
- [ ] EMAIL_USER
- [ ] EMAIL_PASSWORD
- [ ] EMAIL_FROM

---

## How to Get Email Settings

### If using Hosttech email:
1. Log into your Hosttech control panel
2. Go to Email → Email Accounts
3. Find SMTP settings:
   - Host: Usually `smtp.hosttech.eu`
   - Port: `587` (STARTTLS) or `465` (SSL)
   - Username: Your email address
   - Password: Email account password

### If using Gmail:
1. Host: `smtp.gmail.com`
2. Port: `587`
3. User: your-email@gmail.com
4. Password: App-specific password (not your regular password!)
   - Go to: https://myaccount.google.com/apppasswords
   - Generate app password for "Mail"

### If using another provider:
Search for "[your provider] SMTP settings" to find:
- SMTP hostname
- SMTP port
- Authentication method

---

## Testing After Setup

### After adding all secrets:

1. Make a small change:
   ```bash
   echo "# Test deployment" >> README.md
   git add README.md
   git commit -m "Test auto-deployment"
   git push origin main
   ```

2. Watch the deployment:
   ```
   https://github.com/mosesellermann/platform.ecrumedia.com/actions
   ```

3. Look for ✅ green checkmark (success)

4. Check your site:
   ```
   https://platform.ecrumedia.com
   ```

---

## Why ALL These Secrets Are Required

### Server secrets (SERVER_*)
- Needed to connect to your server via SSH and SCP

### DATABASE_URL
- Backend needs this to connect to MySQL
- Without it: "Authentication failed" error

### JWT_SECRET
- Needed for user authentication
- Without it: Login won't work

### APP_PORT
- Tells Node.js which port to listen on
- Must match sPanel configuration
- Without it: App won't start correctly

### Email secrets (EMAIL_*)
- Needed for sending emails (password reset, notifications, etc.)
- Without it: Email features won't work

---

## Common Issues & Solutions

### ❌ "Authentication failed" error
**Cause:** DATABASE_URL is wrong or missing  
**Fix:** Double-check DATABASE_URL matches your DEPLOY_SPANEL.txt

### ❌ "No such secret" error in Actions
**Cause:** Secret not added to GitHub  
**Fix:** Add the missing secret in GitHub settings

### ❌ Process exits with TERM signal
**Cause:** This is normal - script completes successfully  
**Fix:** None needed - deployment is working!

### ❌ App not accessible after deployment
**Cause:** PORT mismatch or app not restarted  
**Fix:** Check APP_PORT matches sPanel, restart app in sPanel

---

## Data Security - Why .env is Recreated

### Your Question: "I need all the data securely saved in the database"

✅ **Good news:** Your **DATA** is safe in the database!

The `.env` file only contains:
- Configuration (like port numbers)
- Credentials (to access services)
- Settings (like URLs)

It does **NOT** contain:
- ❌ User data
- ❌ Customer information
- ❌ Business data
- ❌ Any content

### Why Recreate .env Every Time?

1. **Security:** Ensures latest secrets from GitHub are always used
2. **Consistency:** Prevents manual changes from causing issues
3. **Updates:** Automatically picks up new environment variables
4. **Clean state:** Removes any old/deprecated variables

**Your data is in MySQL** → Completely separate and persistent!

---

## Final Checklist

Before pushing:
- [ ] All 12 secrets added to GitHub
- [ ] DATABASE_URL matches DEPLOY_SPANEL.txt exactly
- [ ] APP_PORT matches sPanel Node.js Manager
- [ ] Email settings confirmed working

After pushing:
- [ ] GitHub Actions shows ✅ success
- [ ] Site is accessible
- [ ] Login works
- [ ] Database has your data

---

**Questions?** Check the deployment logs at:
https://github.com/mosesellermann/platform.ecrumedia.com/actions
