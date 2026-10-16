// Kirim kode OTP SC Games lewat Resend. Tidak mengubah auth settings project:
// kode dibuat dengan auth.admin.generateLink (tidak mengirim email), email dikirim dari sini.
// Secrets: SC_RESEND_API_KEY (atau RESEND_API_KEY bila tidak ada), OTP_FROM (mis. "SC Games 2027 <otp@20fit.id>"). SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY disediakan runtime.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { OTP_HTML, OTP_TXT } from "./templates.ts";

const ALLOWED_ORIGINS = [
  "https://indonesiascgames2027.20fit.id",
  "https://staging-indonesiascgames2027.20fit.id",
  "https://standard-charter-staging.up.railway.app",
];
const SUBJECT = (code: string) => `Kode masuk SC Games 2027: ${code}`;

const sha = async (s: string) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))]
    .map((b) => b.toString(16).padStart(2, "0")).join("");

function cors(origin: string | null) {
  const ok = origin && ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin! : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "content-type, apikey, authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const fill = (t: string, code: string) => t.replaceAll("{{ .Token }}", code);

Deno.serve(async (req) => {
  try { return await handle(req); }
  catch (e) { console.error("sc-send-otp error:", (e as Error).message); return new Response(JSON.stringify({ ok: false, error: "INTERNAL" }), { status: 500, headers: { ...cors(req.headers.get("origin")), "Content-Type": "application/json" } }); }
});

async function handle(req: Request): Promise<Response> {
  const headers = { ...cors(req.headers.get("origin")), "Content-Type": "application/json" };
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return reply(405, { ok: false, error: "METHOD" });

  let email = "";
  try { email = String((await req.json()).email ?? "").trim().toLowerCase(); } catch { /* body kosong */ }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return reply(400, { ok: false, error: "EMAIL_INVALID" });

  const key = Deno.env.get("SC_RESEND_API_KEY") ?? Deno.env.get("RESEND_API_KEY"); const from = Deno.env.get("OTP_FROM");
  if (!key || !from) return reply(500, { ok: false, error: "NOT_CONFIGURED" });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  // rate limit: 1 per 30 detik dan 5 per jam per email, 20 per jam per IP
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const [eh, ih] = [await sha("e:" + email), await sha("i:" + ip)];
  const since = (s: number) => new Date(Date.now() - s * 1000).toISOString();
  const count = async (col: string, v: string, s: number) =>
    (await db.from("otp_requests").select("id", { count: "exact", head: true }).eq(col, v).gte("created_at", since(s))).count ?? 0;
  if (await count("email_hash", eh, 30) > 0) return reply(429, { ok: false, error: "COOLDOWN" });
  if (await count("email_hash", eh, 3600) >= 5 || await count("ip_hash", ih, 3600) >= 20) return reply(429, { ok: false, error: "RATE_LIMIT" });
  await db.from("otp_requests").insert({ email_hash: eh, ip_hash: ih });

  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  const code = data?.properties?.email_otp;
  if (error || !code) { console.error("generateLink gagal:", error?.message); return reply(502, { ok: false, error: "CODE_FAILED" }); }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [email], subject: SUBJECT(code),
      html: fill(OTP_HTML, code),
      text: fill(OTP_TXT, code),
    }),
  });
  if (!res.ok) { console.error("Resend gagal:", res.status); return reply(502, { ok: false, error: "SEND_FAILED" }); }
  const sent = await res.json().catch(() => ({}));
  return reply(200, { ok: true, id: sent.id ?? null });
}
