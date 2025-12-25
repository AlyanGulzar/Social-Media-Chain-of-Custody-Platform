import { supabase } from './supabase';

export type CollectEvidencePayload = {
  platform: 'twitter' | 'facebook' | 'youtube';
  evidence_type: 'post' | 'image' | 'video';
  url: string;
  case_id: string;
};

export async function collectEvidence(payload: CollectEvidencePayload) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error('User not authenticated');
  }

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/collect-evidence`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

        // ✅ REQUIRED BY SUPABASE EDGE GATEWAY
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,

        // ✅ REQUIRED BY YOUR FUNCTION
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to collect evidence');
  }

  return data;
}
