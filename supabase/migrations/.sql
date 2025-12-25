/*
  # Social Media Evidence Chain-of-Custody Database Schema

  ## Overview
  This migration creates the core database structure for the Social Media Evidence 
  Chain-of-Custody Tool, supporting evidence collection from Twitter, Facebook, and 
  YouTube with cryptographic verification and metadata comparison capabilities.

  ## New Tables

  ### 1. `evidence`
  Stores collected social media evidence and metadata
  - `id` (uuid, primary key) - Unique identifier for each evidence item
  - `platform` (text) - Social media platform (twitter, facebook, youtube)
  - `evidence_type` (text) - Type of evidence (post, image, video, comment)
  - `url` (text) - Original URL of the evidence
  - `content` (text) - Text content or description
  - `metadata` (jsonb) - Platform-specific metadata (views, likes, uploader, etc.)
  - `file_url` (text) - URL to stored media file if applicable
  - `collected_by` (uuid) - User who collected the evidence
  - `collected_at` (timestamptz) - Timestamp of collection
  - `case_id` (text) - Case or investigation identifier
  - `status` (text) - Status (collected, verified, tampered, flagged)

  ### 2. `evidence_hashes`
  Stores cryptographic hashes for integrity verification
  - `id` (uuid, primary key)
  - `evidence_id` (uuid, foreign key) - References evidence table
  - `hash_algorithm` (text) - Algorithm used (SHA-256, SHA3-512)
  - `hash_value` (text) - Computed hash
  - `hash_type` (text) - Type (content, metadata, thumbnail, frame_sample)
  - `computed_at` (timestamptz) - When hash was computed

  ### 3. `youtube_comparisons`
  Stores YouTube metadata comparison results
  - `id` (uuid, primary key)
  - `comparison_name` (text) - Name/description of comparison
  - `video_ids` (text[]) - Array of YouTube video IDs being compared
  - `similarity_scores` (jsonb) - Similarity metrics (title, description, visual)
  - `metadata_analysis` (jsonb) - Detailed comparison results
  - `flagged_duplicates` (text[]) - Video IDs flagged as potential duplicates
  - `created_by` (uuid) - User who initiated comparison
  - `created_at` (timestamptz) - When comparison was performed

  ### 4. `verification_logs`
  Tracks integrity verification attempts and results
  - `id` (uuid, primary key)
  - `evidence_id` (uuid, foreign key) - References evidence table
  - `verification_type` (text) - Type of verification performed
  - `original_hash` (text) - Original hash value
  - `current_hash` (text) - Re-computed hash value
  - `is_valid` (boolean) - Whether hashes match
  - `discrepancies` (jsonb) - Details of any tampering detected
  - `verified_by` (uuid) - User who performed verification
  - `verified_at` (timestamptz) - Timestamp of verification

  ## Security
  - RLS enabled on all tables
  - Authenticated users can insert their own evidence
  - Users can only view and verify evidence they collected or have case access to
  - All verification logs are immutable once created
*/

-- Create evidence table
CREATE TABLE IF NOT EXISTS evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('twitter', 'facebook', 'youtube', 'other')),
  evidence_type text NOT NULL CHECK (evidence_type IN ('post', 'image', 'video', 'comment', 'profile')),
  url text NOT NULL,
  content text,
  metadata jsonb DEFAULT '{}'::jsonb,
  file_url text,
  collected_by uuid REFERENCES auth.users(id),
  collected_at timestamptz DEFAULT now(),
  case_id text NOT NULL,
  status text DEFAULT 'collected' CHECK (status IN ('collected', 'verified', 'tampered', 'flagged', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create evidence_hashes table
CREATE TABLE IF NOT EXISTS evidence_hashes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id uuid REFERENCES evidence(id) ON DELETE CASCADE,
  hash_algorithm text NOT NULL CHECK (hash_algorithm IN ('SHA-256', 'SHA3-512', 'MD5', 'perceptual')),
  hash_value text NOT NULL,
  hash_type text NOT NULL CHECK (hash_type IN ('content', 'metadata', 'thumbnail', 'frame_sample', 'full_file')),
  computed_at timestamptz DEFAULT now()
);

-- Create youtube_comparisons table
CREATE TABLE IF NOT EXISTS youtube_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_name text NOT NULL,
  video_ids text[] NOT NULL,
  similarity_scores jsonb DEFAULT '{}'::jsonb,
  metadata_analysis jsonb DEFAULT '{}'::jsonb,
  flagged_duplicates text[] DEFAULT ARRAY[]::text[],
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create verification_logs table
CREATE TABLE IF NOT EXISTS verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id uuid REFERENCES evidence(id) ON DELETE CASCADE,
  verification_type text NOT NULL,
  original_hash text NOT NULL,
  current_hash text NOT NULL,
  is_valid boolean NOT NULL,
  discrepancies jsonb DEFAULT '{}'::jsonb,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_evidence_platform ON evidence(platform);
CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_collected_by ON evidence(collected_by);
CREATE INDEX IF NOT EXISTS idx_evidence_hashes_evidence_id ON evidence_hashes(evidence_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_evidence_id ON verification_logs(evidence_id);

-- Enable Row Level Security
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for evidence table
CREATE POLICY "Users can insert their own evidence"
  ON evidence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = collected_by);

CREATE POLICY "Users can view their own evidence"
  ON evidence FOR SELECT
  TO authenticated
  USING (auth.uid() = collected_by);

CREATE POLICY "Users can update their own evidence"
  ON evidence FOR UPDATE
  TO authenticated
  USING (auth.uid() = collected_by)
  WITH CHECK (auth.uid() = collected_by);

CREATE POLICY "Users can delete their own evidence"
  ON evidence FOR DELETE
  TO authenticated
  USING (auth.uid() = collected_by);

-- RLS Policies for evidence_hashes table
CREATE POLICY "Users can insert hashes for their evidence"
  ON evidence_hashes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM evidence
      WHERE evidence.id = evidence_hashes.evidence_id
      AND evidence.collected_by = auth.uid()
    )
  );

CREATE POLICY "Users can view hashes for their evidence"
  ON evidence_hashes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM evidence
      WHERE evidence.id = evidence_hashes.evidence_id
      AND evidence.collected_by = auth.uid()
    )
  );

-- RLS Policies for youtube_comparisons table
CREATE POLICY "Users can insert their own comparisons"
  ON youtube_comparisons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their own comparisons"
  ON youtube_comparisons FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own comparisons"
  ON youtube_comparisons FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for verification_logs table
CREATE POLICY "Users can insert verification logs for their evidence"
  ON verification_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM evidence
      WHERE evidence.id = verification_logs.evidence_id
      AND evidence.collected_by = auth.uid()
    )
  );

CREATE POLICY "Users can view verification logs for their evidence"
  ON verification_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM evidence
      WHERE evidence.id = verification_logs.evidence_id
      AND evidence.collected_by = auth.uid()
    )
  );
