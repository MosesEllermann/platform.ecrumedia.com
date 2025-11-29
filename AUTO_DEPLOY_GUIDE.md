# Automatic Deployment Setup Guide

This guide shows you how to set up automatic deployments that trigger every time you push to the `main` branch.

---

## ✅ Current Status

You already have a GitHub Actions workflow (`.github/workflows/deploy.yml`) configured!

---

## 🔐 Step 1: Add GitHub Secrets

To enable automatic deployment, you need to add your server credentials as **GitHub Secrets**.

### How to Add Secrets:

1. Go to your GitHub repository: https://github.com/mosesellermann/platform.ecrumedia.com
2. Click **Settings** (top right)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret** for each of the following:

### Required Secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `SERVER_HOST` | `ecrumedia.com` | Your server hostname |
| `SERVER_USER` | `site22570` | Your SSH username |
| `SERVER_PASSWORD` | `[your-password]` | Your SSH password |
| `SERVER_PORT` | `6543` | SSH port |

---

## 🚀 Step 2: How It Works

Once secrets are added, every time you push to `main`:

1. **GitHub Actions builds** your frontend and backend
2. **Uploads files** to your server via SCP
3. **Installs dependencies** on the server
4. **Runs database migrations**
5. **Restarts** the Node.js app

---

## 📝 Step 3: Test the Auto-Deployment

After adding secrets, make a small change and push:

```bash
# Make a small change (e.g., edit README.md)
echo "\n# Auto-deploy test" >> README.md

# Commit and push
git add README.md
git commit -m "Test auto-deployment"
git push origin main
```

### Monitor the Deployment:

1. Go to: https://github.com/mosesellermann/platform.ecrumedia.com/actions
2. Watch the workflow run in real-time
3. Check for any errors

---

## 🔧 Alternative: SSH Key (More Secure)

If you prefer using SSH keys instead of passwords:

### Generate SSH Key on Your Local Machine:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
```

### Copy Public Key to Server:

```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub -p 6543 site22570@ecrumedia.com
```

### Add Private Key to GitHub Secrets:

```bash
# Copy the private key
cat ~/.ssh/github_deploy
```

1. Go to GitHub → Settings → Secrets
2. Add new secret: `SERVER_SSH_KEY`
3. Paste the entire private key (including `-----BEGIN` and `-----END` lines)

### Update `.github/workflows/deploy.yml`:

Replace all instances of:
```yaml
password: ${{ secrets.SERVER_PASSWORD }}
```

With:
```yaml
key: ${{ secrets.SERVER_SSH_KEY }}
```

---

## 🛠️ Troubleshooting

### Deployment Fails?

1. **Check GitHub Actions logs**: https://github.com/mosesellermann/platform.ecrumedia.com/actions
2. **Verify secrets** are set correctly
3. **Test SSH manually**:
   ```bash
   ssh -p 6543 site22570@ecrumedia.com
   ```

### App Not Restarting?

The workflow uses `pkill` to restart the app. If sPanel doesn't auto-restart:

1. Login to sPanel
2. Go to **Node.js Manager**
3. Manually restart the app

Or update the workflow to use sPanel's restart command if available.

---

## 📊 Comparison: Manual vs Auto-Deploy

| Task | Manual | Auto-Deploy |
|------|--------|-------------|
| Build frontend | ✋ 2 min | ✅ Automatic |
| Build backend | ✋ 2 min | ✅ Automatic |
| Upload files | ✋ 5 min | ✅ Automatic |
| SSH to server | ✋ 1 min | ✅ Automatic |
| Install deps | ✋ 5 min | ✅ Automatic |
| Run migrations | ✋ 1 min | ✅ Automatic |
| Restart app | ✋ 1 min | ✅ Automatic |
| **TOTAL TIME** | **~17 min** | **~5 min (hands-free!)** |

---

## 🎯 Future Improvements

1. **Add deployment notifications** (Slack, Discord, Email)
2. **Run tests before deploying**
3. **Deploy to staging first**, then production
4. **Rollback on failure**

---

## Option 2: Git Hooks on Server (Alternative)

If GitHub Actions doesn't work, you can set up a **post-receive hook** directly on the server:

1. SSH to server
2. Create bare repo: `git init --bare ~/deploy.git`
3. Add post-receive hook that builds and copies files
4. Add remote: `git remote add production ssh://site22570@ecrumedia.com:6543/~/deploy.git`
5. Push: `git push production main`

Let me know if you want this approach instead!

---

## 💡 Recommendation

**Use GitHub Actions** (Option 1) - it's more reliable and easier to manage.
