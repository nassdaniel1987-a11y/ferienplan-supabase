import { createClient } from '@supabase/supabase-js';

// Supabase Client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

// Diese Funktion läuft automatisch alle 6 Stunden
export default async function handler(req, context) {
  console.log('🏓 Keep-Alive: Pinge Supabase...');

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Einfache Query um Datenbank aktiv zu halten
    const { data, error } = await supabase
      .from('angebote')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Keep-Alive Fehler:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Keep-Alive erfolgreich');

    return new Response(JSON.stringify({
      success: true,
      message: 'Supabase Keep-Alive erfolgreich',
      timestamp: new Date().toISOString(),
      recordsFound: data?.length || 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Keep-Alive Exception:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Netlify Scheduled Function Config
export const config = {
  schedule: '0 */6 * * *'  // Alle 6 Stunden (um 00:00, 06:00, 12:00, 18:00)
};
