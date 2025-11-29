# 🚨 Quick Fix for Database Deployment Error

## The Problem
Your deployment fails with:
```
Error: P1000: Authentication failed against database server, 
the provided database credentials for `ihr_mysql_user` are not valid.
```

## The Cause
The `DATABASE_URL` secret in GitHub still has **placeholder text** instead of your real MySQL credentials.

## The Fix (5 minutes)

### Step 1: Get Your MySQL Credentials from sPanel

1. Log into sPanel at: https://spanel.hosttech.eu (or your sPanel URL)
2. Go to **Databases** → **MySQL Databases**
3. Find or create a database for this project
4. Note down:
   - **Database name** (e.g., `site22570_platform`)
   - **Database user** (e.g., `site22570_db`)
   - **Database password** (if you don't remember, reset it)

### Step 2: Update GitHub Secret

1. Go to: https://github.com/mosesellermann/platform.ecrumedia.com/settings/secrets/actions

2. Find the `DATABASE_URL` secret

3. Click **Update**

4. Enter your connection string in this exact format:
   ```
   mysql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:3306/YOUR_DB_NAME
   ```

   **Example:**
   ```
   mysql://site22570_db:SecurePass123@localhost:3306/site22570_platform
   ```

   **Important:** 
   - No spaces
   - Use actual values (not placeholders)
   - If password has special characters like `@`, `#`, `:`, URL-encode them:
     - `@` → `%40`
     - `#` → `%23`
     - `:` → `%3A`

5. Click **Update secret**

### Step 3: Test Deployment

1. Make a small change (or use the Actions tab to re-run the workflow)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update database credentials"
   git push origin main
   ```

3. Watch deployment at: https://github.com/mosesellermann/platform.ecrumedia.com/actions

4. Look for ✅ green checkmark (success) instead of ❌ red X (failure)

## Verification

After deployment succeeds, you should see in the deployment logs:
```
✔ Generated Prisma Client
✔ Prisma schema loaded
✔ Migration deployed successfully
```

## Still Having Issues?

### Error: "Can't reach database server"
- Check that MySQL is running in sPanel
- Verify database exists
- Ensure user has permissions to that database

### Error: "Database does not exist"
- Create the database in sPanel first
- Make sure database name in URL matches exactly

### Error: "Access denied"
- Double-check username and password
- Reset MySQL password in sPanel if needed
- Ensure user has access to the specific database

## Need Help?

1. Check deployment logs: https://github.com/mosesellermann/platform.ecrumedia.com/actions
2. Review full guide: `GITHUB_SECRETS_SETUP.md`
3. Check sPanel MySQL settings for exact credentials

---

**Quick Checklist:**
- [ ] Get MySQL credentials from sPanel
- [ ] Update DATABASE_URL secret in GitHub
- [ ] Format: `mysql://user:pass@localhost:3306/dbname`
- [ ] Push a commit to trigger deployment
- [ ] Verify deployment succeeds

✅ **After this fix, your auto-deployment should work perfectly!**
