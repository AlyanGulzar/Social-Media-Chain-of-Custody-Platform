# Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

#### Create a Supabase Project

1. Go to https://supabase.com and sign up
2. Create a new project
3. Wait for the database to be provisioned

#### Get Your Credentials

1. Go to Project Settings > API
2. Copy your Project URL
3. Copy your anon/public key

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Initialize Database

The database schema will be automatically created when you first run the application. The migration includes:

- Evidence storage tables
- Hash storage tables
- Comparison results tables
- Verification logs tables
- Row Level Security policies

### 5. Start Development Server

```bash
npm run dev
```

Your application will be available at http://localhost:5173

## First Time Use

### 1. Create an Account

- Open the application
- Click "Don't have an account? Sign up"
- Enter your email and password
- Sign up

### 2. Collect Your First Evidence

1. Click "Collect Evidence" in the sidebar
2. Select a platform (e.g., YouTube)
3. Select evidence type (e.g., video)
4. Enter a URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
5. Enter a Case ID (e.g., `CASE-2024-001`)
6. Click "Collect & Hash Evidence"

### 3. View Your Evidence

- Click "Evidence Database" in the sidebar
- You'll see your collected evidence with status and metadata

### 4. Verify Integrity

1. Click "Verify Integrity" in the sidebar
2. Select your evidence from the dropdown
3. Click "Verify Integrity"
4. View the verification results

### 5. Compare YouTube Videos

1. Click "YouTube Comparison" in the sidebar
2. Enter a comparison name
3. Add 2+ YouTube video URLs
4. Click "Compare Metadata"
5. View similarity scores and analysis

### 6. Generate Report

1. Go to "Verify Integrity"
2. Select evidence
3. Click "Generate Report"
4. Download the forensic report

## Production Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized production files.

### Deploy to Vercel

1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy

### Deploy to Netlify

1. Push your code to GitHub
2. Go to https://netlify.com
3. Import your repository
4. Add environment variables in Netlify dashboard
5. Deploy

## Connecting Real APIs

### YouTube Data API

1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Update `compare-youtube` edge function with real API calls

Example modification in edge function:

```typescript
// Replace mock data with real API call
const response = await fetch(
  `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics&key=${API_KEY}`
);
const data = await response.json();
```

### Twitter API v2

1. Go to https://developer.twitter.com
2. Create a new app
3. Get your Bearer Token
4. Update `collect-evidence` edge function

### Facebook Graph API

1. Go to https://developers.facebook.com
2. Create a new app
3. Get your access token
4. Update `collect-evidence` edge function

## Common Issues

### "Missing Supabase environment variables"

- Ensure `.env` file exists in project root
- Check that variables start with `VITE_`
- Restart dev server after creating `.env`

### "Failed to collect evidence"

- Check Supabase dashboard for edge function logs
- Verify authentication is working
- Check network tab for error responses

### Build fails with TypeScript errors

```bash
npm run typecheck
```

This will show you which files have type errors.

### Database connection issues

- Check Supabase project is active
- Verify credentials in `.env`
- Check RLS policies in Supabase dashboard

## Development Tips

### Testing Edge Functions Locally

Edge functions are deployed to Supabase and cannot run locally without the Supabase CLI. For testing:

1. Deploy functions to Supabase
2. Use the hosted URLs
3. Check logs in Supabase dashboard

### Database Queries

You can test queries directly in Supabase SQL Editor:

```sql
-- View all evidence
SELECT * FROM evidence;

-- View evidence with hashes
SELECT e.*, eh.hash_value
FROM evidence e
LEFT JOIN evidence_hashes eh ON e.id = eh.evidence_id;

-- View verification logs
SELECT * FROM verification_logs ORDER BY verified_at DESC;
```

### Debugging

1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for API calls
4. Check Application > Local Storage for auth tokens

## Next Steps

1. Integrate real social media APIs
2. Customize the UI to match your needs
3. Add additional evidence types
4. Enhance comparison algorithms
5. Add more hash algorithms
6. Implement advanced reporting

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## Support

For project-specific questions, contact your team members or instructor.

For technical issues:
- Check Supabase documentation
- Review error messages in browser console
- Check edge function logs in Supabase dashboard
