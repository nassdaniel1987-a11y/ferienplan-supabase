import { createClient } from '@supabase/supabase-js';

// Supabase Client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

// Manuelle Test-Funktion - kann direkt aufgerufen werden
export default async function handler(req, context) {
  console.log('🏓 Ping: Teste Supabase-Verbindung...');

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const startTime = Date.now();

    // Einfache Query
    const { data, error } = await supabase
      .from('angebote')
      .select('id, titel')
      .limit(5);

    const responseTime = Date.now() - startTime;

    if (error) {
      console.error('❌ Ping Fehler:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        responseTime: responseTime + 'ms'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.log('✅ Ping erfolgreich -', data?.length, 'Einträge gefunden');

    return new Response(JSON.stringify({
      success: true,
      message: 'Supabase ist erreichbar und aktiv',
      timestamp: new Date().toISOString(),
      responseTime: responseTime + 'ms',
      recordsFound: data?.length || 0,
      sampleData: data
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('❌ Ping Exception:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
