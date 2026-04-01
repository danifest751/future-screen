/**
 * Script to generate TypeScript types from Supabase database schema.
 * 
 * Usage:
 *   node scripts/generate-supabase-types.mjs
 * 
 * Requirements:
 *   - VITE_SUPABASE_URL or SUPABASE_PROJECT_ID in .env
 *   - Supabase CLI installed (npx supabase)
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputPath = resolve(rootDir, 'src/lib/database.types.ts');

// Load environment variables
function loadEnv() {
  try {
    const envPath = resolve(rootDir, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      env[key.trim()] = valueParts.join('=').trim();
    }
    return env;
  } catch {
    return {};
  }
}

function getProjectId(env) {
  // Try to get project ID from environment
  return process.env.SUPABASE_PROJECT_ID 
    || env.SUPABASE_PROJECT_ID
    || env.VITE_SUPABASE_PROJECT_ID
    || extractProjectIdFromUrl(env.VITE_SUPABASE_URL)
    || null;
}

function extractProjectIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

async function generateTypes() {
  console.log('🔧 Generating Supabase TypeScript types...\n');

  const env = loadEnv();
  const projectId = getProjectId(env);

  if (!projectId) {
    console.error('❌ Error: Could not determine Supabase project ID.');
    console.error('   Set SUPABASE_PROJECT_ID or VITE_SUPABASE_URL in .env file');
    process.exit(1);
  }

  console.log(`📋 Project ID: ${projectId}`);
  console.log(`📁 Output: ${outputPath}\n`);

  try {
    // Generate types using Supabase CLI
    const command = `npx supabase gen types typescript --project-id "${projectId}" --schema public`;
    console.log('⏳ Running Supabase CLI...');
    
    const output = execSync(command, { 
      cwd: rootDir,
      encoding: 'utf-8',
      env: { ...process.env, ...env }
    });

    // Add header comment
    const header = `// Auto-generated Supabase types. Do not edit manually.
// Generated at: ${new Date().toISOString()}
// Command: npx supabase gen types typescript --project-id ${projectId} --schema public

`;

    writeFileSync(outputPath, header + output, 'utf-8');
    
    console.log('✅ Types generated successfully!');
    console.log(`📄 Written to: src/lib/database.types.ts`);
  } catch (error) {
    console.error('❌ Error generating types:');
    console.error(error.message);
    console.error('\nMake sure Supabase CLI is available:');
    console.error('  npm install -g supabase');
    console.error('  or use npx supabase');
    process.exit(1);
  }
}

generateTypes();
