# Deployment Guide for PeopleFlow HR Management System

## Required Environment Variables

### Backend Project (people-flow-backend)
Set these in Vercel → Settings → Environment Variables:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET=your-secure-random-secret-key-here
FRONTEND_URL=https://people-flow-by-hh.vercel.app
NODE_ENV=production
```

**Important Notes:**
- `MONGO_URI`: Must be a valid MongoDB Atlas connection string with network access allowed for 0.0.0.0/0 (or Vercel IPs)
- `JWT_SECRET`: Generate a secure random string (at least 32 characters)
- `FRONTEND_URL`: Your frontend domain (no trailing slash, no paths)
- Apply to: Production, Preview, and Development environments

### Frontend Project (people-flow)
Set these in Vercel → Settings → Environment Variables:

```
VITE_API_URL=https://people-flow-backend.vercel.app
```

**Important Notes:**
- `VITE_API_URL`: Your backend domain (no trailing slash)
- Apply to: Production, Preview, and Development environments
- **Must redeploy** after setting this variable (Vite bundles env vars at build time)

## Vercel Project Settings

### Frontend Project
- **Root Directory**: `/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Backend Project
- **Root Directory**: `/backend`
- **Build Command**: (leave default)
- **Output Directory**: (leave default)

## Common Issues & Solutions

### Issue: "Loading..." hangs forever
**Cause**: Frontend `VITE_API_URL` not set or backend not responding
**Solution**: 
1. Set `VITE_API_URL` in frontend Vercel project
2. Redeploy frontend
3. Check backend logs for MongoDB connection errors

### Issue: CORS errors
**Cause**: Backend `FRONTEND_URL` doesn't match your frontend origin
**Solution**: 
1. Set `FRONTEND_URL=https://people-flow-by-hh.vercel.app` in backend
2. Redeploy backend
3. Check backend logs for `[CORS]` debug messages

### Issue: Backend 300s timeout errors
**Cause**: MongoDB connection failing or timing out
**Solution**:
1. Verify `MONGO_URI` is correct
2. Check MongoDB Atlas network access (allow 0.0.0.0/0)
3. Check MongoDB Atlas cluster is not paused
4. Verify connection string has correct credentials

### Issue: 404 on /login route
**Cause**: SPA routing not configured
**Solution**: Already fixed - `frontend/vercel.json` added with rewrite rules

## Testing Deployment

### 1. Check Backend Health
```bash
curl https://people-flow-backend.vercel.app/health
```
Expected response:
```json
{
  "status": "ok",
  "mongoConfigured": true
}
```

### 2. Check Frontend Loads
- Open: https://people-flow-by-hh.vercel.app/login
- Should see login form (not "Loading..." forever)
- Check DevTools → Network → `/api/auth/me` should return 401 (expected if not logged in)

### 3. Test Login
- Default credentials (set via backend env):
  - Email: admin@company.com
  - Password: admin123
- Or use seeded admin account

## Deployment Checklist

- [ ] Backend env vars set (MONGO_URI, JWT_SECRET, FRONTEND_URL)
- [ ] Frontend env var set (VITE_API_URL)
- [ ] MongoDB Atlas network access configured
- [ ] Backend redeployed after env changes
- [ ] Frontend redeployed after env changes
- [ ] Health endpoint returns 200
- [ ] Login page loads (not stuck on "Loading...")
- [ ] Can log in successfully
- [ ] No CORS errors in browser console

## Git Push & Deploy

```bash
# Commit all changes
git add .
git commit -m "Fix auth flow, CORS, and MongoDB connection handling"
git push

# Vercel will auto-deploy both projects
# Monitor deployments in Vercel dashboard
```
