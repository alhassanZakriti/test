# Backend-Frontend Connection Fix

## Issues Fixed ✅

### 1. **CORS Configuration**
- Added middleware to handle CORS for all API routes
- Configured CORS headers in `next.config.js`
- Allows `http://localhost:3000` origin

### 2. **Environment Variables**
- Created `.env.local` with default values
- Fixed missing `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
- Made OAuth providers optional (Google/Facebook)

### 3. **Database Connection**
- Improved Prisma client error handling
- Added connection error logging
- Using SQLite for development (file:./dev.db)

### 4. **API Routes**
- Added proper CORS headers via middleware
- Better error handling in Prisma client
- Optional OAuth providers to prevent initialization errors

## Files Modified/Created

1. **`.env.local`** - Created with default configuration
2. **`middleware.ts`** - Created for CORS handling
3. **`lib/prisma.ts`** - Added connection error handling
4. **`lib/auth.ts`** - Made OAuth providers optional
5. **`next.config.js`** - Added CORS headers configuration

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 2. Setup Database
```bash
# Generate Prisma client
npx prisma generate

# Create database tables (for SQLite)
npx prisma db push

# Or run migrations (for PostgreSQL)
npx prisma migrate dev
```

### 3. Configure Environment Variables

Edit `.env.local` file:

**Required:**
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="modual-secret-key-change-in-production-12345678"
DATABASE_URL="file:./dev.db"  # SQLite for dev
```

**Optional (for PostgreSQL):**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/modual?schema=public"
```

**Optional (for OAuth):**
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
```

### 4. Start Development Server
```bash
pnpm dev
# or
npm run dev
```

### 5. Test the Application

Visit: `http://localhost:3000`

**Test Authentication:**
1. Go to `/auth/registreren` to create an account
2. Use email + password to register
3. Login at `/auth/inloggen`

**Test API:**
1. Open browser console
2. Check for any CORS errors (should be none)
3. Try creating a project in the dashboard

## Common Issues & Solutions

### Issue: "Failed to connect to database"
**Solution:** 
- Check `DATABASE_URL` in `.env.local`
- Run `npx prisma db push` to create tables
- For PostgreSQL: Make sure PostgreSQL is running

### Issue: "NEXTAUTH_SECRET is not set"
**Solution:**
- Ensure `.env.local` exists
- Generate a new secret: `openssl rand -base64 32`
- Add to `.env.local`: `NEXTAUTH_SECRET="your-generated-secret"`

### Issue: CORS errors in browser
**Solution:**
- Restart the development server
- Clear browser cache
- Check `middleware.ts` is in root directory

### Issue: OAuth not working
**Solution:**
- OAuth providers are now optional
- Leave `GOOGLE_CLIENT_ID` and `FACEBOOK_CLIENT_ID` empty to disable
- Use email/password authentication instead

## API Endpoints

All API endpoints are available at `http://localhost:3000/api/`:

- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login user
- **GET** `/api/auth/me` - Get current user
- **GET** `/api/projects` - Get all projects
- **POST** `/api/projects` - Create project
- **GET** `/api/projects/[id]` - Get project by ID
- **PUT** `/api/projects/[id]` - Update project
- **DELETE** `/api/projects/[id]` - Delete project

## Testing Checklist

- [ ] Server starts without errors
- [ ] Homepage loads at `http://localhost:3000`
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Dashboard loads after login
- [ ] Can create new project
- [ ] No CORS errors in console
- [ ] Theme switcher works
- [ ] Language switcher works

## Development Tips

1. **Check Server Logs:** Always check terminal for error messages
2. **Browser Console:** Check for client-side errors
3. **Database:** Use Prisma Studio to view database: `npx prisma studio`
4. **API Testing:** Use browser DevTools Network tab to debug API calls

## Need Help?

1. Check `.env.local` has all required variables
2. Restart development server: `Ctrl+C` then `pnpm dev`
3. Clear Next.js cache: Delete `.next` folder and restart
4. Regenerate Prisma client: `npx prisma generate`

---

**Status:** All backend-frontend connection issues should now be resolved! 🎉
