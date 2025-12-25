# System Architecture

## Overview

The Social Media Evidence Chain-of-Custody Tool is built using a modern web application architecture with a React frontend, Supabase backend, and edge functions for serverless API handling.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  (React + TypeScript + Tailwind CSS + Vite)                 │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth UI     │  │  Dashboard   │  │  Evidence    │     │
│  │              │  │              │  │  Collection  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Evidence    │  │  YouTube     │  │  Verification│     │
│  │  List        │  │  Comparison  │  │  Panel       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ HTTPS + Auth Tokens
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                    Supabase Platform                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Authentication Layer                     │  │
│  │         (Email/Password + Session Management)        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               Edge Functions (Deno)                   │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐                 │  │
│  │  │   collect-   │  │   verify-    │                 │  │
│  │  │   evidence   │  │   evidence   │                 │  │
│  │  └──────────────┘  └──────────────┘                 │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐                 │  │
│  │  │   compare-   │  │   generate-  │                 │  │
│  │  │   youtube    │  │   report     │                 │  │
│  │  └──────────────┘  └──────────────┘                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            PostgreSQL Database                        │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ evidence │  │ evidence_│  │ youtube_ │          │  │
│  │  │          │  │  hashes  │  │comparison│          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  │                                                        │  │
│  │  ┌──────────┐                                         │  │
│  │  │verification                                        │  │
│  │  │  _logs   │                                         │  │
│  │  └──────────┘                                         │  │
│  │                                                        │  │
│  │  All tables protected by Row Level Security (RLS)    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

#### 1. Authentication Layer (`AuthContext.tsx`, `Auth.tsx`)

**Responsibilities:**
- User authentication state management
- Sign up, sign in, and sign out operations
- Session persistence
- Protected route handling

**Implementation:**
- React Context API for global auth state
- Supabase Auth for backend authentication
- Automatic token refresh
- Session storage in browser

#### 2. Dashboard (`Dashboard.tsx`)

**Responsibilities:**
- Main navigation and layout
- View routing between different panels
- User information display
- Logout functionality

**Features:**
- Sidebar navigation
- Active view highlighting
- Responsive design
- User email display

#### 3. Evidence Collection (`EvidenceCollection.tsx`)

**Responsibilities:**
- Capture evidence URLs
- Select platform and evidence type
- Assign case IDs
- Trigger collection process

**Workflow:**
1. User inputs URL and metadata
2. Form validation
3. API call to `collect-evidence` edge function
4. Display success/error feedback
5. Hash generation confirmation

#### 4. Evidence List (`EvidenceList.tsx`)

**Responsibilities:**
- Display all collected evidence
- Filter by platform
- Show evidence status
- Provide quick access to original URLs

**Features:**
- Real-time data loading from database
- Platform-based filtering
- Status badges
- Timestamp display
- External link access

#### 5. YouTube Comparison (`YouTubeComparison.tsx`)

**Responsibilities:**
- Collect multiple YouTube URLs
- Initiate comparison analysis
- Display similarity results
- Flag potential duplicates

**Analysis Methods:**
- Levenshtein distance calculation
- Metadata comparison
- Visual similarity scoring
- Upload pattern analysis

#### 6. Verification Panel (`VerificationPanel.tsx`)

**Responsibilities:**
- Select evidence for verification
- Trigger integrity checks
- Display verification results
- Generate forensic reports

**Verification Process:**
1. Load original evidence and hashes
2. Re-fetch content from source
3. Compute new hash
4. Compare hashes
5. Log verification attempt
6. Update evidence status

### Backend Architecture

#### Database Schema

**evidence table:**
```sql
- id: uuid (primary key)
- platform: text (twitter/facebook/youtube)
- evidence_type: text (post/image/video)
- url: text (original URL)
- content: text (captured content)
- metadata: jsonb (platform-specific data)
- case_id: text (investigation identifier)
- status: text (collected/verified/tampered)
- collected_by: uuid (user reference)
- collected_at: timestamptz
```

**evidence_hashes table:**
```sql
- id: uuid (primary key)
- evidence_id: uuid (foreign key)
- hash_algorithm: text (SHA-256/SHA3-512)
- hash_value: text (computed hash)
- hash_type: text (content/metadata/thumbnail)
- computed_at: timestamptz
```

**youtube_comparisons table:**
```sql
- id: uuid (primary key)
- comparison_name: text
- video_ids: text[] (array of YouTube IDs)
- similarity_scores: jsonb (comparison metrics)
- metadata_analysis: jsonb (detailed results)
- flagged_duplicates: text[] (suspicious videos)
- created_by: uuid (user reference)
- created_at: timestamptz
```

**verification_logs table:**
```sql
- id: uuid (primary key)
- evidence_id: uuid (foreign key)
- verification_type: text
- original_hash: text
- current_hash: text
- is_valid: boolean
- discrepancies: jsonb
- verified_by: uuid (user reference)
- verified_at: timestamptz
```

#### Row Level Security (RLS)

All tables implement RLS policies:

1. **Evidence Table:**
   - Users can insert their own evidence
   - Users can view only their evidence
   - Users can update only their evidence
   - Users can delete only their evidence

2. **Evidence Hashes:**
   - Users can insert hashes for their evidence
   - Users can view hashes for their evidence
   - Read-only after creation

3. **YouTube Comparisons:**
   - Users can create comparisons
   - Users can view their comparisons
   - Users can delete their comparisons

4. **Verification Logs:**
   - Users can insert logs for their evidence
   - Users can view logs for their evidence
   - Immutable once created (audit trail)

### Edge Functions

#### 1. collect-evidence

**Purpose:** Collect evidence from social media platforms and generate cryptographic hashes

**Flow:**
1. Receive platform, URL, case_id from client
2. Authenticate user
3. Fetch content (currently mock data)
4. Generate SHA-256 hash of content + metadata
5. Insert evidence record into database
6. Insert hash records
7. Return evidence ID and hash

**Hash Generation:**
```typescript
async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

#### 2. verify-evidence

**Purpose:** Re-verify evidence integrity by comparing hashes

**Flow:**
1. Receive evidence_id from client
2. Authenticate user
3. Load original evidence and hashes
4. Re-fetch content from source
5. Compute new hash
6. Compare with original hash
7. Log verification attempt
8. Update evidence status
9. Return verification result

**Integrity Check:**
```typescript
const isValid = originalHash === currentHash;
```

#### 3. compare-youtube

**Purpose:** Compare metadata of multiple YouTube videos

**Flow:**
1. Receive video URLs from client
2. Extract video IDs from URLs
3. Fetch metadata for each video (currently mock)
4. Calculate similarity scores using Levenshtein distance
5. Compare upload dates, durations, views
6. Flag potential duplicates (similarity > 70%)
7. Store comparison results
8. Return analysis

**Similarity Calculation:**
```typescript
function calculateSimilarity(str1: string, str2: string): number {
  const distance = calculateLevenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}
```

#### 4. generate-report

**Purpose:** Generate text-based forensic report

**Flow:**
1. Receive evidence_id from client
2. Load evidence, hashes, and verification logs
3. Format data into structured text report
4. Include all metadata, hashes, and chain-of-custody
5. Return as downloadable text file

**Report Sections:**
- Header with case information
- Evidence details
- Cryptographic hashes
- Verification history
- Metadata dump
- Chain-of-custody certification

## Security Architecture

### Authentication Flow

1. User submits credentials
2. Supabase Auth validates and creates session
3. JWT token issued to client
4. Token stored in browser (httpOnly cookie)
5. Token included in all API requests
6. Edge functions verify token before processing

### Data Protection

**Client Side:**
- No sensitive data in localStorage
- HTTPS enforced for all communications
- CORS properly configured
- XSS protection via React

**Server Side:**
- Row Level Security on all tables
- Service role key only in edge functions
- Input validation and sanitization
- Rate limiting on edge functions

**Database:**
- Encrypted at rest
- SSL connections required
- Automatic backups
- Point-in-time recovery

### Hash Integrity

**Chain of Custody:**
1. Evidence collected → Hash computed
2. Hash stored with timestamp
3. Verification requested → New hash computed
4. Hashes compared → Result logged
5. Status updated → Audit trail created

**Tamper Detection:**
- Any modification changes hash
- Original hash preserved
- All verifications logged
- Discrepancies documented

## Performance Considerations

### Frontend Optimization

- Code splitting with React.lazy
- Memoization of expensive components
- Debounced search inputs
- Optimistic UI updates
- Efficient re-rendering with proper keys

### Backend Optimization

- Database indexes on frequently queried columns
- Efficient queries with proper joins
- Connection pooling
- Edge function cold start mitigation
- Caching where appropriate

### Scalability

**Current Limitations:**
- Mock API data (no real social media APIs)
- Text-based reports (not PDFs)
- Single-region deployment
- No distributed caching

**Future Scaling:**
- CDN for static assets
- Database read replicas
- Redis for caching
- Message queue for async processing
- Multi-region deployment

## Development Workflow

### Local Development

1. Frontend runs on Vite dev server (port 5173)
2. Backend uses hosted Supabase instance
3. Edge functions deployed to Supabase
4. Database migrations auto-applied

### Testing Strategy

**Unit Tests:** (To be implemented)
- Component rendering
- Hash generation accuracy
- Similarity calculations
- Form validations

**Integration Tests:** (To be implemented)
- End-to-end evidence collection
- Verification workflow
- Comparison analysis
- Report generation

**Manual Testing:**
- User flows
- Edge cases
- Error handling
- UI/UX validation

## Deployment Architecture

### Production Setup

```
User Browser
    ↓
CDN (Static Assets)
    ↓
Supabase Edge (Global)
    ↓
Supabase Database (Region)
```

### Hosting Options

1. **Vercel** (Recommended)
   - Automatic deployments from Git
   - Global CDN
   - Serverless functions
   - Environment variables

2. **Netlify**
   - Similar to Vercel
   - Built-in CI/CD
   - Form handling
   - Split testing

3. **Static Hosting**
   - AWS S3 + CloudFront
   - Google Cloud Storage
   - Azure Static Web Apps

## Monitoring and Logging

### Application Monitoring

- Browser console errors
- Network request failures
- Performance metrics
- User session tracking

### Backend Monitoring

- Supabase dashboard logs
- Edge function invocations
- Database query performance
- Authentication events

### Audit Trail

- All evidence collection logged
- Every verification attempt recorded
- User actions timestamped
- Database changes tracked

## Future Enhancements

### Phase 1: API Integration
- Implement real Twitter API calls
- Integrate Facebook Graph API
- Connect YouTube Data API v3
- Handle API rate limits

### Phase 2: Advanced Features
- ML-based video frame comparison
- Blockchain timestamping
- Multi-user case collaboration
- Advanced search and filtering

### Phase 3: Enterprise Features
- Role-based access control
- Custom report templates
- Automated evidence collection
- API for third-party integrations

### Phase 4: Scale & Performance
- Distributed caching
- Background job processing
- Multi-region deployment
- Advanced analytics dashboard
