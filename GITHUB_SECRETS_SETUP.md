# GitHub Secrets Setup for Auto-Deployment

## ⚙️ One-Time Configuration

To enable automatic deployments, you need to add these secrets to your GitHub repository:

### How to Add Secrets:

1. Go to your GitHub repository: https://github.com/mosesellermann/platform.ecrumedia.com
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of the following secrets:

---

## Required Secrets:

### 1. SERVER_HOST
- **Name:** `SERVER_HOST`
- **Value:** `78.46.76.56` (or `ecrumedia.com`)
- **Description:** Your server hostname or IP address

### 2. SERVER_PORT
- **Name:** `SERVER_PORT`
- **Value:** `6543`
- **Description:** SSH port for your server

### 3. SERVER_USER
- **Name:** `SERVER_USER`
- **Value:** `site22570`
- **Description:** Your SSH username

### 4. SERVER_PASSWORD
- **Name:** `SERVER_PASSWORD`
- **Value:** `[Your SSH password]`
- **Description:** Your SSH password (the one you use to login via SSH)

### 5. DATABASE_URL
- **Name:** `DATABASE_URL`
- **Value:** `mysql://username:password@localhost:3306/database_name`
- **Description:** MySQL database connection string on your server

### 6. JWT_SECRET
- **Name:** `JWT_SECRET`
- **Value:** `[Random secure string, e.g., generated with: openssl rand -base64 32]`
- **Description:** Secret key for JWT token generation

### 7. EMAIL_HOST
- **Name:** `EMAIL_HOST`
- **Value:** `smtp.example.com`
- **Description:** SMTP server hostname

### 8. EMAIL_PORT
- **Name:** `EMAIL_PORT`
- **Value:** `587` or `465`
- **Description:** SMTP server port

### 9. EMAIL_USER
- **Name:** `EMAIL_USER`
- **Value:** `your-email@example.com`
- **Description:** SMTP username

### 10. EMAIL_PASSWORD
- **Name:** `EMAIL_PASSWORD`
- **Value:** `[Your email password]`
- **Description:** SMTP password

### 11. EMAIL_FROM
- **Name:** `EMAIL_FROM`
- **Value:** `"ECRU Media Platform" <noreply@ecrumedia.com>`
- **Description:** From address for outgoing emails

---

## 🚀 How It Works After Setup:

Once secrets are configured, automatic deployment happens like this:

```
1. Make code changes locally
2. git add .
3. git commit -m "Your changes"
4. git push origin main
   ↓
5. GitHub Actions automatically:
   - Builds frontend & backend
   - Uploads to server
   - Runs migrations
   - Restarts backend
   ↓
6. ✅ Live in 3-5 minutes!
```

---

## 🔍 Monitor Deployments:

- Go to: https://github.com/mosesellermann/platform.ecrumedia.com/actions
- You'll see each deployment and can view logs
- Red ❌ = Failed (check logs)
- Green ✅ = Successful

---

## 🛠️ Manual Deployment Trigger:

You can also trigger deployments manually without pushing:
1. Go to: https://github.com/mosesellermann/platform.ecrumedia.com/actions
2. Click "Deploy to sPanel"
3. Click "Run workflow"

---

## 📝 Time Comparison:

**Manual Deployment:** ~2 hours (build, upload, configure)
**Automated Deployment:** ~3-5 minutes (just `git push`)

**Savings:** ~115 minutes per deployment! 🎉

---

## 🔐 Security Note:

Your SSH password is stored securely in GitHub Secrets and never exposed in logs or code.

Alternative: You can use SSH keys instead of passwords by:
1. Generating SSH key: `ssh-keygen -t ed25519`
2. Adding public key to server: `ssh-copy-id -p 6543 site22570@ecrumedia.com`
3. Using `key` instead of `password` in GitHub Actions workflow
4. Adding private key as `SERVER_SSH_KEY` secret
