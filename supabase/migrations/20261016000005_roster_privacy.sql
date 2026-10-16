-- Privasi: kapten tidak boleh membaca baris participants anggota (telepon, tanggal lahir, email).
-- (drop policy sempat timeout lewat MCP, jadi dinonaktifkan dengan using (false); efeknya sama)
alter policy participants_captain_read on public.participants using (false);

-- Hubungkan undangan ke akun yang sudah ada saat anggota ditambahkan.
create function public.team_members_link() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.participant_id is null then
    select user_id into new.participant_id from public.participants where lower(email) = lower(new.invited_email);
  end if;
  return new;
end $$;
create trigger team_members_link before insert on public.team_members
  for each row execute function public.team_members_link();

-- Roster tim: hanya kolom yang dibutuhkan. Nama dan gender baru terlihat setelah anggota mengonfirmasi.
create function public.team_roster(p_team uuid)
returns table (member_id uuid, invited_email text, role text, is_substitute boolean, status text,
               display_name text, gender text, is_captain boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_sc_admin()
          or exists (select 1 from public.teams t where t.id = p_team and t.captain_id = auth.uid())
          or exists (select 1 from public.team_members m where m.team_id = p_team and m.participant_id = auth.uid())) then
    return;
  end if;
  return query
    select m.id, m.invited_email, m.role, m.is_substitute, m.status,
           case when m.status = 'confirmed' then p.display_name end,
           case when m.status = 'confirmed' then p.gender end,
           (m.participant_id = t.captain_id)
      from public.team_members m
      join public.teams t on t.id = m.team_id
      left join public.participants p on p.user_id = m.participant_id
     where m.team_id = p_team
     order by m.created_at;
end $$;
revoke execute on function public.team_roster(uuid) from public, anon;
grant execute on function public.team_roster(uuid) to authenticated;
