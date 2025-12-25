import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

Deno.serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    );

    // 🔐 Auth
    const auth = req.headers.get('authorization');
    if (!auth) throw new Error('Unauthorized');

    const { data: { user } } =
      await supabase.auth.getUser(auth.replace('Bearer ', ''));

    if (!user) throw new Error('Unauthorized');

    const { comparison_name, video_urls } = await req.json();

    if (!comparison_name) {
      throw new Error('comparison_name is required');
    }

    if (!Array.isArray(video_urls) || video_urls.length < 2) {
      throw new Error('At least 2 YouTube URLs are required');
    }

    // ✅ Extract and validate IDs
    const videoIds = video_urls
      .map(extractVideoId)
      .filter((id): id is string => Boolean(id));

    if (videoIds.length < 2) {
      throw new Error('Invalid YouTube URLs provided');
    }

    // ✅ Deterministic comparison result (for now)
    const comparisonResult = {
      comparison_name,
      created_by: user.id,
      video_ids: videoIds,
      same_video: new Set(videoIds).size === 1,
      compared_at: new Date().toISOString(),
    };

    // ✅ Store comparison
    const { data, error } = await supabase
      .from('youtube_comparisons')
      .insert({
        comparison_name,
        video_ids: videoIds,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        comparison_id: data.id,
        result: comparisonResult,
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
