# Testing the Authentication System

## ✅ Services Running

Both services should be running:
- **Backend API:** http://localhost:3000 ✅
- **Frontend:** http://localhost:5173 ✅
- **Database:** PostgreSQL on port 5432 ✅

## 📝 Test Steps

### Method 1: Using the Frontend UI (Recommended)

#### 1. Register a New User

1. Open your browser and go to: **http://localhost:5173/auth/register**
2. Fill in the registration form:
   - **Vorname** (First Name): Max
   - **Nachname** (Last Name): Mustermann
   - **E-Mail**: max@example.com
   - **Firma** (Company): Test GmbH (optional)
   - **Telefon** (Phone): +49 123 456789 (optional)
   - **Passwort** (Password): Test1234!
   - **Passwort bestätigen**: Test1234!
3. Click **"Registrieren"** button
4. You should see a success message and be redirected to login

#### 2. Login with Your Account

1. You'll be automatically redirected to: **http://localhost:5173/auth/login**
2. Enter your credentials:
   - **E-Mail**: max@example.com
   - **Passwort**: Test1234!
3. Click **"Anmelden"** button
4. If successful, you'll be redirected to the dashboard

#### 3. View Your Profile

After logging in, your user data and JWT token are stored in localStorage. You can verify this:

1. Open browser DevTools (F12)
2. Go to **Application** → **Local Storage** → **http://localhost:5173**
3. You should see:
   - `accessToken`: Your JWT token
   - `user`: Your user data (JSON)

---

### Method 2: Using API Testing Tools (Postman/Thunder Client)

#### 1. Register a User

**POST** http://localhost:3000/auth/register

```json
{
  "email": "test@example.com",
  "password": "Test1234!",
  "firstName": "Max",
  "lastName": "Mustermann",
  "company": "Test GmbH",
  "phone": "+49 123 456789"
}
```

**Expected Response (201 Created):**
```json
{
  "message": "Registrierung erfolgreich",
  "user": {
    "id": "clxxxx...",
    "email": "test@example.com",
    "firstName": "Max",
    "lastName": "Mustermann",
    "role": "CLIENT",
    "createdAt": "2025-11-07T..."
  }
}
```

#### 2. Login

**POST** http://localhost:3000/auth/login

```json
{
  "email": "test@example.com",
  "password": "Test1234!"
}
```

**Expected Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clxxxx...",
    "email": "test@example.com",
    "firstName": "Max",
    "lastName": "Mustermann",
    "role": "CLIENT"
  }
}
```

Copy the `accessToken` for the next steps.

#### 3. Get Current User Profile (Protected Route)

**GET** http://localhost:3000/auth/me

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Expected Response (200 OK):**
```json
{
  "id": "clxxxx...",
  "email": "test@example.com",
  "firstName": "Max",
  "lastName": "Mustermann",
  "role": "CLIENT",
  "company": "Test GmbH",
  "isActive": true
}
```

#### 4. Logout

**POST** http://localhost:3000/auth/logout

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Expected Response (200 OK):**
```json
{
  "message": "Erfolgreich abgemeldet"
}
```

---

### Method 3: Using cURL (Terminal)

#### Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "curl@example.com",
    "password": "Test1234!",
    "firstName": "cURL",
    "lastName": "User"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "curl@example.com",
    "password": "Test1234!"
  }'
```

Save the token from the response, then:

#### Get Profile
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔍 Verify in Database

You can view the created users in Prisma Studio:

```bash
cd backend
npx prisma studio
```

This opens http://localhost:5555 where you can:
- See all registered users in the `User` table
- Check sessions in the `Session` table
- View audit logs in the `AuditLog` table

---

## 🐛 Common Issues

### "Network Error" on Frontend
- Make sure backend is running on port 3000
- Check CORS is enabled in `backend/src/main.ts`

### "Unauthorized" Error
- Check if JWT token is valid
- Token might be expired (7 days expiry by default)

### Database Connection Error
- Verify PostgreSQL container is running: `docker ps`
- Restart if needed: `cd backend && docker-compose restart`

### Registration Fails with "User already exists"
- This email is already registered
- Try a different email or delete the user from database

---

## 📊 What Gets Created

When you register, the system creates:

1. **User record** in the database with:
   - Hashed password (bcrypt)
   - Role: CLIENT (default)
   - Active status: true
   
2. **Session record** when you login with:
   - JWT token
   - User ID
   - Expiration date (7 days)

3. **Audit log** entries for:
   - User login
   - User logout

---

## ✨ Features to Test

- ✅ User registration with validation
- ✅ Password hashing (passwords are never stored in plain text)
- ✅ User login with JWT token
- ✅ Protected routes (try accessing /auth/me without token)
- ✅ Session management
- ✅ German UI translations
- ✅ Form validation and error messages
- ✅ Dark mode support on login/register pages

---

## 🎉 Next Steps After Testing

Once authentication works, we can proceed to:
1. Create protected dashboard routes
2. Build the invoice management system
3. Implement "Als Kunde einloggen" for admins
4. Add WordPress site management
5. Add domain and email management

Happy testing! 🚀
