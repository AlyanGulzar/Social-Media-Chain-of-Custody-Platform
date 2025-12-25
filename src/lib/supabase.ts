import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Evidence = {
  id: string;
  platform: 'twitter' | 'facebook' | 'youtube' | 'other';
  evidence_type: 'post' | 'image' | 'video' | 'comment' | 'profile';
  url: string;
  content?: string;
  metadata?: Record<string, unknown>;
  file_url?: string;
  collected_by?: string;
  collected_at?: string;
  case_id: string;
  status: 'collected' | 'verified' | 'tampered' | 'flagged' | 'archived';
  created_at?: string;
  updated_at?: string;
};

export type EvidenceHash = {
  id: string;
  evidence_id: string;
  hash_algorithm: 'SHA-256' | 'SHA3-512' | 'MD5' | 'perceptual';
  hash_value: string;
  hash_type: 'content' | 'metadata' | 'thumbnail' | 'frame_sample' | 'full_file';
  computed_at?: string;
};

export type YouTubeComparison = {
  id: string;
  comparison_name: string;
  video_ids: string[];
  similarity_scores?: Record<string, unknown>;
  metadata_analysis?: Record<string, unknown>;
  flagged_duplicates?: string[];
  created_by?: string;
  created_at?: string;
};

export type VerificationLog = {
  id: string;
  evidence_id: string;
  verification_type: string;
  original_hash: string;
  current_hash: string;
  is_valid: boolean;
  discrepancies?: Record<string, unknown>;
  verified_by?: string;
  verified_at?: string;
};
supabase.auth.getSession().then(res => {
  console.log('SESSION CHECK:', res);
});
