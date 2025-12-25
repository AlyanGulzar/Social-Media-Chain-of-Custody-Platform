import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
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

    const { platform, evidence_type, url, case_id } = await req.json();
    if (!platform || !evidence_type || !url || !case_id) {
      throw new Error('Missing required fields');
    }

    // ✅ FORENSIC CANONICAL CONTENT (DETERMINISTIC)
    const canonicalEvidence = {
      platform,
      evidence_type,
      url,
      case_id,
    };

    const canonicalString = JSON.stringify(canonicalEvidence);
    const contentHash = await sha256(canonicalString);

    // Insert evidence
    const { data: evidence, error: insertError } = await supabase
      .from('evidence')
      .insert({
        platform,
        evidence_type,
        url,
        case_id,
        collected_by: user.id,
        status: 'collected',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Store hash
    await supabase.from('evidence_hashes').insert({
      evidence_id: evidence.id,
      hash_algorithm: 'SHA-256',
      hash_type: 'content',
      hash_value: contentHash,
    });

    return new Response(
      JSON.stringify({
        success: true,
        evidence_id: evidence.id,
        hash: contentHash,
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
      { status: 400, headers: corsHeaders }
    );
  }
});
