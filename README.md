# Social Media Evidence Chain-of-Custody Tool

A comprehensive digital forensics platform for collecting, verifying, and preserving social media evidence from Twitter, Facebook, and YouTube with cryptographic integrity verification.

## Features

### Core Functionality

- **Evidence Collection**: Automated collection of social media posts, images, and videos via official APIs
- **Cryptographic Hashing**: SHA-256 hash generation for all collected artifacts
- **Integrity Verification**: Re-verification system to detect tampering or modifications
- **YouTube Metadata Comparison**: Advanced analysis tool to compare similar videos from different uploaders
- **Chain-of-Custody Reports**: Generate comprehensive forensic reports for legal proceedings
- **Secure Storage**: PostgreSQL database with Row Level Security (RLS)

### Technical Capabilities

1. **Multi-Platform Support**
   - Twitter (X)
   - Facebook
   - YouTube

2. **Hash Algorithms**
   - SHA-256 (primary)
   - SHA3-512 (optional)
   - Perceptual hashing for images

3. **Metadata Comparison**
   - Levenshtein distance for text similarity
   - Cosine similarity for content analysis
   - Frame-based video comparison
   - Thumbnail hash matching

4. **Security Features**
   - User authentication and authorization
   - Row Level Security on all database tables
   - Encrypted evidence storage
   - Audit logging for all verification attempts

## Project Structure

```
src/
├── components/
│   ├── Auth.tsx                    # Authentication UI
│   ├── Dashboard.tsx               # Main dashboard layout
│   ├── EvidenceCollection.tsx      # Evidence collection form
│   ├── EvidenceList.tsx            # Evidence database view
│   ├── YouTubeComparison.tsx       # YouTube metadata comparison
│   └── VerificationPanel.tsx       # Integrity verification interface
├── contexts/
│   └── AuthContext.tsx             # Authentication state management
├── lib/
│   └── supabase.ts                 # Supabase client and types
└── App.tsx                         # Main application component

supabase/functions/
├── collect-evidence/               # Evidence collection endpoint
├── verify-evidence/                # Integrity verification endpoint
├── compare-youtube/                # YouTube comparison endpoint
└── generate-report/                # Report generation endpoint
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project at https://supabase.com
2. Copy your project URL and anon key
3. Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

The database schema is automatically created via migrations. It includes:

- `evidence` - Stores collected social media evidence
- `evidence_hashes` - Cryptographic hashes for integrity verification
- `youtube_comparisons` - YouTube metadata comparison results
- `verification_logs` - Audit trail of verification attempts

### 4. Edge Functions

Four edge functions are deployed:

1. **collect-evidence** - Collects evidence and generates hashes
2. **verify-evidence** - Re-verifies evidence integrity
3. **compare-youtube** - Compares YouTube video metadata
4. **generate-report** - Generates forensic reports

### 5. Run the Application

```bash
npm run dev
```

Visit http://localhost:5173 to access the application.

## Usage Guide

### 1. Authentication

- Create an account or sign in
- All evidence is isolated per user via RLS

### 2. Collecting Evidence

1. Navigate to "Collect Evidence"
2. Select platform (Twitter, Facebook, or YouTube)
3. Choose evidence type (post, image, or video)
4. Enter the URL of the content
5. Provide a Case ID for organization
6. Click "Collect & Hash Evidence"

The system will:
- Fetch content via API
- Generate SHA-256 hash
- Store metadata securely
- Create verification baseline

### 3. Viewing Evidence

- Navigate to "Evidence Database"
- Filter by platform or view all
- Review collection timestamps and status
- Access original URLs

### 4. YouTube Comparison

1. Navigate to "YouTube Comparison"
2. Enter a comparison name
3. Add 2 or more YouTube video URLs
4. Click "Compare Metadata"

The system analyzes:
- Title and description similarity
- Upload dates and patterns
- Duration and view counts
- Visual similarity (thumbnails/frames)

Results show:
- Similarity scores
- Potential duplicate flags
- Detailed metadata for each video

### 5. Integrity Verification

1. Navigate to "Verify Integrity"
2. Select evidence to verify
3. Click "Verify Integrity"

The system:
- Re-fetches original content
- Computes new hash
- Compares with stored hash
- Updates evidence status
- Logs verification attempt

Results indicate:
- Valid: Evidence unchanged
- Tampered: Hash mismatch detected

### 6. Generate Reports

1. Select evidence in verification panel
2. Click "Generate Report"
3. Download text-based forensic report

Report includes:
- Case and evidence details
- All cryptographic hashes
- Verification history
- Chain-of-custody information
- Metadata dump

## API Integration

### Social Media APIs

To enable full functionality with real data:

1. **Twitter API v2**
   - Create app at https://developer.twitter.com
   - Add credentials to edge function environment

2. **Facebook Graph API**
   - Create app at https://developers.facebook.com
   - Add credentials to edge function environment

3. **YouTube Data API v3**
   - Enable API at https://console.cloud.google.com
   - Add API key to edge function environment

Currently, the system uses mock data for demonstration. To integrate real APIs, update the edge functions with actual API calls.

## Security Considerations

### Database Security

- All tables have RLS enabled
- Users can only access their own evidence
- Service role key used only in edge functions
- No direct database access from client

### Evidence Integrity

- SHA-256 hashing ensures tamper detection
- Timestamps are immutable
- Verification logs create audit trail
- Re-verification detects any changes

### Best Practices

1. Always verify evidence before court presentation
2. Generate reports for permanent records
3. Use descriptive Case IDs
4. Regular integrity checks for long-term storage
5. Never share Supabase credentials

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth (email/password)
- **Hashing**: Web Crypto API (SHA-256)
- **Icons**: Lucide React

## Evaluation Metrics

### Success Criteria

- Hash Verification Accuracy: ≥ 98%
- Metadata Comparison Accuracy: ≥ 90%
- API Reliability: ≥ 90% success rate
- Database Security: Full RLS enforcement
- Report Quality: Complete evidence documentation

## Future Enhancements

1. Real-time API integration with social platforms
2. Advanced ML-based video comparison
3. Blockchain timestamping for evidence
4. Multi-investigator case collaboration
5. Automated evidence collection via keywords
6. Enhanced PDF reports with visualizations
7. Evidence export in multiple formats
8. Automated duplicate detection alerts

## Troubleshooting

### Build Issues

```bash
npm run typecheck
npm run lint
```

### Database Connection

- Verify `.env` file exists with correct values
- Check Supabase project status
- Ensure RLS policies allow user access

### Edge Functions

- Functions are automatically deployed
- Check Supabase dashboard for function logs
- Verify CORS headers in responses

## License

This project is developed for educational purposes as part of the Digital Forensics Lab (CY334L) course.

## Team

- Muhammad Mueez (231276)
- Alyan Gulzar (231304)
- Saad Bin Arif (231310)
- BSCYS-F23A

**Instructor**: Mr. Abdullah Farooq

## Support

For issues or questions, contact the development team or refer to the project documentation.
