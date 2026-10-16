-- SC Games 2027 — skema registrasi, cheer, dan admin. RLS aktif di semua tabel.

-- ───────── Pengaturan & admin ─────────
create table public.app_settings (
  id smallint primary key default 1 check (id = 1),
  allowed_email_domains text[] not null default '{}',  -- kosong = semua domain boleh
  registration_open boolean not null default true,
  registration_deadline timestamptz,                    -- null = tanpa batas global
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1);

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_sc_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ───────── Katalog cabor ─────────
create table public.sports (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z]+(-[a-z]+)*$'),
  nama text not null,
  kategori text not null check (kategori in ('net_raket','tim','presisi','individu')),
  urutan smallint not null,
  rulebook_path text not null
);

create table public.sport_divisions (
  id smallint generated always as identity primary key,
  sport_id smallint not null references public.sports(id) on delete cascade,
  nama text not null,
  entry_type text not null check (entry_type in ('individual','team')),
  min_players smallint not null default 1 check (min_players >= 1),
  max_players smallint not null default 1,
  max_substitutes smallint not null default 0 check (max_substitutes >= 0),
  gender_rule text not null default 'open' check (gender_rule in ('open','male','female','mixed')),
  min_per_gender smallint,                        -- untuk 'mixed': minimal per gender
  required_roles text[] not null default '{}',    -- mis. {drummer,steersperson}
  registration_deadline timestamptz,              -- null = ikut app_settings
  needs_verification boolean not null default true, -- angka belum dicek ke rulebook resmi
  unique (sport_id, nama),
  check (max_players >= min_players)
);

-- ───────── Peserta ─────────
create table public.participants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null check (char_length(display_name) between 2 and 40),
  full_name text,
  phone text,
  birth_date date,
  gender text check (gender in ('male','female')),
  branch text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index participants_email_key on public.participants (lower(email));

create function public.participants_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare s public.app_settings; dom text;
begin
  select * into s from public.app_settings where id = 1;
  dom := lower(split_part(new.email, '@', 2));
  if cardinality(s.allowed_email_domains) > 0 and not (dom = any (s.allowed_email_domains)) then
    raise exception 'EMAIL_DOMAIN_NOT_ALLOWED' using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger participants_guard before insert or update on public.participants
  for each row execute function public.participants_guard();

-- ───────── Tim ─────────
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  division_id smallint not null references public.sport_divisions(id),
  nama text not null check (char_length(nama) between 2 and 40),
  captain_id uuid not null references public.participants(user_id),
  created_at timestamptz not null default now()
);
create unique index teams_name_key on public.teams (division_id, lower(nama));

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  participant_id uuid references public.participants(user_id),
  invited_email text not null,
  role text,                                         -- mis. drummer, steersperson
  is_substitute boolean not null default false,
  status text not null default 'invited' check (status in ('invited','confirmed','declined')),
  created_at timestamptz not null default now()
);
create unique index team_members_email_key on public.team_members (team_id, lower(invited_email));

-- Kapten otomatis anggota terkonfirmasi.
create function public.teams_add_captain() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.team_members (team_id, participant_id, invited_email, status)
  select new.id, p.user_id, p.email, 'confirmed' from public.participants p where p.user_id = new.captain_id;
  return new;
end $$;
create trigger teams_add_captain after insert on public.teams
  for each row execute function public.teams_add_captain();

-- Hubungkan undangan ke akun saat peserta membuat/ubah profil.
create function public.link_invitations() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.team_members set participant_id = new.user_id
   where participant_id is null and lower(invited_email) = lower(new.email);
  return new;
end $$;
create trigger participants_link after insert on public.participants
  for each row execute function public.link_invitations();

-- ───────── Pendaftaran ─────────
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  division_id smallint not null references public.sport_divisions(id),
  participant_id uuid references public.participants(user_id),
  team_id uuid references public.teams(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected','waitlist')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((participant_id is null) <> (team_id is null))
);
create unique index registrations_individual_key on public.registrations (division_id, participant_id) where participant_id is not null;
create unique index registrations_team_key on public.registrations (team_id) where team_id is not null;

-- Validasi roster. Kode error stabil (dipetakan ke pesan Indonesia di frontend).
create function public.validate_roster(p_team uuid) returns void
language plpgsql security definer set search_path = public as $$
declare d public.sport_divisions; n_main int; n_sub int; n_conf int; n_pend int; n_m int; n_f int; r text;
begin
  select sd.* into d from public.teams t join public.sport_divisions sd on sd.id = t.division_id where t.id = p_team;
  if not found then raise exception 'TEAM_NOT_FOUND' using errcode='P0001'; end if;
  select count(*) filter (where not tm.is_substitute), count(*) filter (where tm.is_substitute),
         count(*) filter (where tm.status='confirmed'), count(*) filter (where tm.status='invited')
    into n_main, n_sub, n_conf, n_pend
    from public.team_members tm where tm.team_id = p_team and tm.status <> 'declined';
  if n_pend > 0 then raise exception 'ROSTER_UNCONFIRMED_MEMBERS' using errcode='P0001'; end if;
  if n_main < d.min_players then raise exception 'ROSTER_MIN_PLAYERS' using errcode='P0001', detail = d.min_players::text; end if;
  if n_main > d.max_players then raise exception 'ROSTER_MAX_PLAYERS' using errcode='P0001', detail = d.max_players::text; end if;
  if n_sub > d.max_substitutes then raise exception 'ROSTER_MAX_SUBSTITUTES' using errcode='P0001', detail = d.max_substitutes::text; end if;
  if d.gender_rule in ('male','female') and exists (
      select 1 from public.team_members tm join public.participants p on p.user_id = tm.participant_id
       where tm.team_id = p_team and tm.status='confirmed' and p.gender is distinct from d.gender_rule) then
    raise exception 'ROSTER_GENDER_MISMATCH' using errcode='P0001';
  end if;
  if d.gender_rule = 'mixed' and d.min_per_gender is not null then
    select count(*) filter (where p.gender='male'), count(*) filter (where p.gender='female') into n_m, n_f
      from public.team_members tm join public.participants p on p.user_id = tm.participant_id
     where tm.team_id = p_team and tm.status='confirmed' and not tm.is_substitute;
    if n_m < d.min_per_gender or n_f < d.min_per_gender then
      raise exception 'ROSTER_GENDER_MIX' using errcode='P0001', detail = d.min_per_gender::text; end if;
  end if;
  foreach r in array d.required_roles loop
    if not exists (select 1 from public.team_members tm where tm.team_id = p_team and tm.status='confirmed' and tm.role = r) then
      raise exception 'ROSTER_MISSING_ROLE' using errcode='P0001', detail = r; end if;
  end loop;
end $$;

create function public.registrations_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare s public.app_settings; d public.sport_divisions; dl timestamptz; pdiv smallint;
begin
  select * into s from public.app_settings where id = 1;
  select * into d from public.sport_divisions where id = new.division_id;
  dl := coalesce(d.registration_deadline, s.registration_deadline);
  if not public.is_sc_admin() then
    if tg_op = 'INSERT' or old.status = 'pending' then
      if not s.registration_open then raise exception 'REGISTRATION_CLOSED' using errcode='P0001'; end if;
      if dl is not null and now() > dl then raise exception 'DEADLINE_PASSED' using errcode='P0001'; end if;
    end if;
    if tg_op = 'UPDATE' and (new.status <> old.status or new.admin_note is distinct from old.admin_note) then
      raise exception 'ADMIN_ONLY' using errcode='P0001'; end if;
    if tg_op = 'INSERT' and new.status <> 'pending' then raise exception 'ADMIN_ONLY' using errcode='P0001'; end if;
  end if;
  if new.team_id is not null then
    select division_id into pdiv from public.teams where id = new.team_id;
    if pdiv <> new.division_id then raise exception 'DIVISION_MISMATCH' using errcode='P0001'; end if;
    if d.entry_type <> 'team' then raise exception 'ENTRY_TYPE_MISMATCH' using errcode='P0001'; end if;
    perform public.validate_roster(new.team_id);
  elsif d.entry_type <> 'individual' then
    raise exception 'ENTRY_TYPE_MISMATCH' using errcode='P0001';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger registrations_guard before insert or update on public.registrations
  for each row execute function public.registrations_guard();

-- Roster terkunci setelah tim disetujui / lewat deadline (kecuali admin).
create function public.team_members_lock() returns trigger
language plpgsql security definer set search_path = public as $$
declare tid uuid := coalesce(new.team_id, old.team_id);
begin
  if public.is_sc_admin() then return coalesce(new, old); end if;
  if exists (select 1 from public.registrations r where r.team_id = tid and r.status <> 'pending') then
    raise exception 'ROSTER_LOCKED' using errcode='P0001'; end if;
  return coalesce(new, old);
end $$;
create trigger team_members_lock before insert or update or delete on public.team_members
  for each row execute function public.team_members_lock();

-- ───────── Cheer penonton (tanpa login) ─────────
create table public.cheers (
  id bigint generated always as identity primary key,
  sport_slug text,
  sender_name text not null check (char_length(sender_name) between 1 and 30),
  message text not null check (char_length(message) between 1 and 140),
  client_id text not null check (char_length(client_id) between 8 and 64),
  ip_hash text,
  created_at timestamptz not null default now()
);
create index cheers_created_idx on public.cheers (created_at desc);
create index cheers_client_idx on public.cheers (client_id, created_at desc);
create index cheers_ip_idx on public.cheers (ip_hash, created_at desc);

create view public.cheer_board with (security_invoker = false) as
  select id, sport_slug, sender_name, message, created_at from public.cheers order by id desc limit 100;

-- Satu-satunya jalur insert: rate limit 5 detik per client dan 10/menit per IP.
create function public.post_cheer(p_name text, p_message text, p_client_id text, p_sport text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare iph text; nid bigint;
begin
  iph := md5(coalesce((current_setting('request.headers', true)::json ->> 'x-forwarded-for'), 'unknown'));
  if exists (select 1 from public.cheers where client_id = p_client_id and created_at > now() - interval '5 seconds') then
    raise exception 'CHEER_COOLDOWN' using errcode='P0001'; end if;
  if (select count(*) from public.cheers where ip_hash = iph and created_at > now() - interval '1 minute') >= 10 then
    raise exception 'CHEER_RATE_LIMIT' using errcode='P0001'; end if;
  insert into public.cheers (sport_slug, sender_name, message, client_id, ip_hash)
  values (p_sport, btrim(p_name), btrim(p_message), p_client_id, iph) returning id into nid;
  return nid;
end $$;

-- ───────── View publik: hanya nama tampil, tim, branch (peserta disetujui) ─────────
create view public.public_roster with (security_invoker = false) as
  select r.division_id, d.sport_id, 'individual'::text as entry_type, p.display_name, null::text as team_name, p.branch
    from public.registrations r join public.participants p on p.user_id = r.participant_id
    join public.sport_divisions d on d.id = r.division_id where r.status = 'approved'
  union all
  select r.division_id, d.sport_id, 'team', p.display_name, t.nama, p.branch
    from public.registrations r join public.teams t on t.id = r.team_id
    join public.team_members tm on tm.team_id = t.id and tm.status = 'confirmed'
    join public.participants p on p.user_id = tm.participant_id
    join public.sport_divisions d on d.id = r.division_id where r.status = 'approved';

-- ───────── RLS ─────────
alter table public.app_settings enable row level security;
alter table public.admins enable row level security;
alter table public.sports enable row level security;
alter table public.sport_divisions enable row level security;
alter table public.participants enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.registrations enable row level security;
alter table public.cheers enable row level security;

create policy settings_read on public.app_settings for select using (true);
create policy settings_admin on public.app_settings for update using (public.is_sc_admin()) with check (public.is_sc_admin());
create policy admins_self on public.admins for select using (user_id = auth.uid() or public.is_sc_admin());
create policy sports_read on public.sports for select using (true);
create policy sports_admin on public.sports for all using (public.is_sc_admin()) with check (public.is_sc_admin());
create policy divisions_read on public.sport_divisions for select using (true);
create policy divisions_admin on public.sport_divisions for all using (public.is_sc_admin()) with check (public.is_sc_admin());

create policy participants_own on public.participants for all
  using (user_id = auth.uid() or public.is_sc_admin())
  with check (user_id = auth.uid() and email = (auth.jwt() ->> 'email'));
-- Kapten boleh melihat nama anggota timnya
create policy participants_captain_read on public.participants for select using (
  exists (select 1 from public.team_members tm join public.teams t on t.id = tm.team_id
          where tm.participant_id = participants.user_id and t.captain_id = auth.uid()));

create policy teams_read on public.teams for select using (
  captain_id = auth.uid() or public.is_sc_admin()
  or exists (select 1 from public.team_members tm where tm.team_id = teams.id and tm.participant_id = auth.uid()));
create policy teams_insert on public.teams for insert with check (captain_id = auth.uid());
create policy teams_update on public.teams for update using (captain_id = auth.uid() or public.is_sc_admin());
create policy teams_delete on public.teams for delete using (captain_id = auth.uid() or public.is_sc_admin());

create policy members_read on public.team_members for select using (
  participant_id = auth.uid() or lower(invited_email) = lower(auth.jwt() ->> 'email') or public.is_sc_admin()
  or exists (select 1 from public.teams t where t.id = team_members.team_id and t.captain_id = auth.uid()));
create policy members_captain_write on public.team_members for insert with check (
  exists (select 1 from public.teams t where t.id = team_id and t.captain_id = auth.uid()));
create policy members_captain_delete on public.team_members for delete using (
  exists (select 1 from public.teams t where t.id = team_id and t.captain_id = auth.uid()) or public.is_sc_admin());
-- Anggota yang diundang hanya boleh mengubah status undangannya sendiri
create policy members_respond on public.team_members for update using (
  participant_id = auth.uid() or lower(invited_email) = lower(auth.jwt() ->> 'email')
  or exists (select 1 from public.teams t where t.id = team_id and t.captain_id = auth.uid()) or public.is_sc_admin());

create policy reg_read on public.registrations for select using (
  participant_id = auth.uid() or public.is_sc_admin()
  or exists (select 1 from public.teams t where t.id = registrations.team_id and t.captain_id = auth.uid()));
create policy reg_insert on public.registrations for insert with check (
  participant_id = auth.uid()
  or exists (select 1 from public.teams t where t.id = team_id and t.captain_id = auth.uid()));
create policy reg_update on public.registrations for update using (
  public.is_sc_admin() or participant_id = auth.uid()
  or exists (select 1 from public.teams t where t.id = registrations.team_id and t.captain_id = auth.uid()));
create policy reg_delete on public.registrations for delete using (
  public.is_sc_admin() or (status = 'pending' and (participant_id = auth.uid()
  or exists (select 1 from public.teams t where t.id = registrations.team_id and t.captain_id = auth.uid()))));

-- cheers: tidak ada policy langsung; baca lewat cheer_board, tulis lewat post_cheer
create policy cheers_admin on public.cheers for select using (public.is_sc_admin());

-- ───────── Grants ─────────
revoke all on public.cheers from anon, authenticated;
revoke all on public.admins from anon;
revoke execute on function public.post_cheer(text,text,text,text) from public;
grant execute on function public.post_cheer(text,text,text,text) to anon, authenticated;
grant select on public.cheer_board, public.public_roster to anon, authenticated;
grant select on public.sports, public.sport_divisions, public.app_settings to anon, authenticated;
revoke execute on function public.validate_roster(uuid) from public, anon;
