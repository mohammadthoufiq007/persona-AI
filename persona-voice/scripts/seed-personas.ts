import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local
try {
  if (fs.existsSync('.env.local')) {
    const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2]?.trim().replace(/^['"]|['"]$/g, '') || '';
      }
    }
  }
} catch {}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log('Seeding personas into Supabase...');
  const personasDir = path.join(process.cwd(), 'content', 'personas');
  const files = fs.readdirSync(personasDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(personasDir, file), 'utf-8');
    const data = JSON.parse(raw);

    const { error } = await supabase.from('personas').upsert(
      {
        slug: data.slug,
        name: data.name,
        public_config: data.public_config,
        private_config: data.private_config,
      },
      { onConflict: 'slug' }
    );

    if (error) {
      console.error(`Error inserting ${data.slug}:`, error.message);
    } else {
      console.log(`Successfully seeded persona: ${data.slug} (${data.name})`);
    }
  }

  console.log('Seeding complete.');
}

main().catch(console.error);
