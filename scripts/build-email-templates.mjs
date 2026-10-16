#!/usr/bin/env node
// Menanam supabase/email-templates/otp.{html,txt} ke supabase/functions/sc-send-otp/templates.ts.
// Edge Function tidak membaca file saat runtime (file statis tidak ikut terbundel).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, 'supabase/email-templates', f), 'utf8');
const out = `// GENERATED oleh scripts/build-email-templates.mjs dari supabase/email-templates/. Jangan diedit tangan.
export const OTP_HTML = ${JSON.stringify(read('otp.html'))};
export const OTP_TXT = ${JSON.stringify(read('otp.txt'))};
`;
fs.writeFileSync(path.join(ROOT, 'supabase/functions/sc-send-otp/templates.ts'), out);
console.log('Ditulis: supabase/functions/sc-send-otp/templates.ts');
