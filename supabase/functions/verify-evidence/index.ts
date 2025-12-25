import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  // ✅ CORS PREFLIGHT
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    );

    const auth = req.headers.get('authorization');
    if (!auth) throw new Error('Unauthorized');

    const { data: { user } } =
      await supabase.auth.getUser(auth.replace('Bearer ', ''));

    if (!user) throw new Error('Unauthorized');

    const { evidence_id } = await req.json();
    if (!evidence_id) throw new Error('Missing evidence_id');

    const { data: evidence } = await supabase
      .from('evidence')
      .select('*')
      .eq('id', evidence_id)
      .single();

    if (!evidence) throw new Error('Evidence not found');

    // 🔐 Canonical deterministic content
    const canonicalEvidence = {
      platform: evidence.platform,
      evidence_type: evidence.evidence_type,
      url: evidence.url,
      case_id: evidence.case_id,
    };

    const canonicalString = JSON.stringify(canonicalEvidence);
    const currentHash = await sha256(canonicalString);

    const { data: originalHashRow } = await supabase
      .from('evidence_hashes')
      .select('*')
      .eq('evidence_id', evidence_id)
      .eq('hash_type', 'content')
      .single();

    if (!originalHashRow) throw new Error('Original hash not found');

    const originalHash = originalHashRow.hash_value;
    const isValid = originalHash === currentHash;

    await supabase.from('verification_logs').insert({
      evidence_id,
      verified_by: user.id,
      is_valid: isValid,
    });

    await supabase
      .from('evidence')
      .update({ status: isValid ? 'verified' : 'tampered' })
      .eq('id', evidence_id);

    return new Response(
      JSON.stringify({
        is_valid: isValid,
        original_hash: originalHash,
        current_hash: currentHash,
        discrepancies: isValid ? null : { hash: 'Hash mismatch' },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  }
});
