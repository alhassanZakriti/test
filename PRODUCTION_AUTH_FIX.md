# Fix Authentication in Production (Vercel)

## Issue
Authentication works locally but fails in production on Vercel.

## Root Causes & Solutions

### 1. **Verify Environment Variables in Vercel Dashboard**

Go to your Vercel project: https://vercel.com/alhassanzakriti/modual-ma

Navigate to: **Settings → Environment Variables**

Ensure ALL these variables are set for **Production, Preview, and Development**:

```env
DATABASE_URL=postgres://57696db69f7fce1af3573bd5260ccc87fd611d0b565ec10ee487f3a07b1c6888:sk_1tcM1T62PtbetrfOzkO7E@db.prisma.io:5432/postgres?sslmode=require

NEXTAUTH_URL=https://modual-ma.vercel.app
NEXTAUTH_SECRET=X9kL2mN5pQ8rT1vW4yZ7aB0cD3eF6gH9iJ2kL5mN8pQ1=

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCWha1sbZ1-zbTalGBQXWCvPOtQBmF1Fr8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=modual-web-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=modual-web-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=modual-web-app.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=606603016078
NEXT_PUBLIC_FIREBASE_APP_ID=1:606603016078:web:89412f34209425b14e96df
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-30T415NF98
```

**CRITICAL**: After adding/updating environment variables, you MUST redeploy!

---

### 2. **Add Vercel Domain to Firebase Authorized Domains**

Go to: https://console.firebase.google.com/project/modual-web-app/authentication/settings

Navigate to: **Authentication → Settings → Authorized domains**

Add these domains:
- ✅ `modual-ma.vercel.app` (your main domain)
- ✅ `localhost` (already added for local dev)

If you have any preview deployments, you may also need to add:
- `*.vercel.app` (for all preview deployments)

---

### 3. **Check NEXTAUTH_URL Configuration**

The `NEXTAUTH_URL` must EXACTLY match your production domain:

**❌ Wrong:**
- `http://modual-ma.vercel.app` (http instead of https)
- `https://modual-ma.vercel.app/` (trailing slash)
- `https://www.modual-ma.vercel.app` (www subdomain)

**✅ Correct:**
- `https://modual-ma.vercel.app`

---

### 4. **Verify Database Connection**

The PostgreSQL database should be accessible from Vercel. Test by checking Vercel deployment logs:

1. Go to Vercel Dashboard → Deployments
2. Click on the latest deployment
3. Check the **Runtime Logs** tab
4. Look for any database connection errors

---

### 5. **Check for CORS Issues**

In `next.config.js`, we have CORS set to `'*'`. Verify this is still present:

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ],
    },
  ];
}
```

---

## Step-by-Step Fix Process

### Step 1: Set Environment Variables in Vercel

1. Go to https://vercel.com (login with your account)
2. Select your project: **modual-ma**
3. Go to **Settings** → **Environment Variables**
4. Add each variable from the list above
5. For each variable:
   - Select all environments: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

### Step 2: Add Vercel Domain to Firebase

1. Go to https://console.firebase.google.com
2. Select project: **modual-web-app**
3. Navigate to: **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Enter: `modual-ma.vercel.app`
6. Click **Add**

### Step 3: Commit and Push Latest Changes

```powershell
git add .
git commit -m "Fix Firebase auth route: always update password for Google users"
git push origin main
```

### Step 4: Trigger Vercel Redeploy

Option A - Automatic (recommended):
- Vercel will auto-deploy when you push to GitHub

Option B - Manual:
1. Go to Vercel Dashboard → Deployments
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**
4. Check ✅ "Use existing Build Cache" (optional)
5. Click **Redeploy**

### Step 5: Test in Production

1. Go to https://modual-ma.vercel.app/auth/inloggen
2. Try normal email/password login
3. Try Google sign-in
4. Check browser console for errors (F12)

---

## Common Errors & Solutions

### Error: "Auth callback error: Configuration"
**Cause**: NEXTAUTH_URL not set or incorrect
**Solution**: Set `NEXTAUTH_URL=https://modual-ma.vercel.app` in Vercel env vars

### Error: "Firebase popup blocked" or "Invalid origin"
**Cause**: Vercel domain not in Firebase authorized domains
**Solution**: Add `modual-ma.vercel.app` to Firebase authorized domains

### Error: "Database connection timeout"
**Cause**: DATABASE_URL not set or incorrect in Vercel
**Solution**: Copy exact DATABASE_URL from .env.production to Vercel

### Error: "401 Unauthorized" on credentials login
**Cause**: Password mismatch or user not in database
**Solution**: The Firebase route now always updates passwords correctly

### Error: "CORS policy blocked"
**Cause**: CORS headers not set properly
**Solution**: Verify next.config.js has CORS headers for /api routes

---

## Verification Checklist

After completing all steps, verify:

- [ ] All environment variables are set in Vercel dashboard
- [ ] Environment variables are set for **Production** environment
- [ ] Vercel domain is added to Firebase authorized domains
- [ ] Latest code is pushed to GitHub
- [ ] Vercel has automatically redeployed (or manually triggered)
- [ ] Can access https://modual-ma.vercel.app
- [ ] Normal login works in production
- [ ] Google sign-in works in production
- [ ] After login, redirected to /dashboard
- [ ] User session persists on page refresh

---

## Still Not Working?

Check Vercel Runtime Logs:
1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** tab
3. Click on the latest deployment
4. Click **Runtime Logs** tab
5. Look for any error messages
6. Share the errors for further debugging

Check Browser Console:
1. Open https://modual-ma.vercel.app/auth/inloggen
2. Press F12 to open Developer Tools
3. Go to **Console** tab
4. Try to sign in
5. Check for any red error messages
6. Share the errors for further debugging
