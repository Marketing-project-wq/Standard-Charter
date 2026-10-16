-- Rate limit permintaan OTP untuk Edge Function sc-send-otp (generateLink tidak membatasi pengiriman email).
-- Hanya service role yang boleh mengakses: RLS aktif tanpa policy.
create table public.otp_requests (
  id bigint generated always as identity primary key,
  email_hash text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index otp_requests_email_idx on public.otp_requests (email_hash, created_at desc);
create index otp_requests_ip_idx on public.otp_requests (ip_hash, created_at desc);
alter table public.otp_requests enable row level security;
revoke all on public.otp_requests from anon, authenticated;
