-- Hanya anggota yang diundang (atau admin) yang boleh mengubah status undangannya;
-- anggota tidak boleh mengubah peran/cadangan/email. Kapten tidak bisa mengonfirmasi atas nama orang lain.
create function public.team_members_update_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare me_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
        is_self boolean := (old.participant_id = auth.uid()) or (lower(old.invited_email) = me_email);
begin
  if public.is_sc_admin() then return new; end if;
  if new.team_id <> old.team_id or lower(new.invited_email) <> lower(old.invited_email) then
    raise exception 'ADMIN_ONLY' using errcode = 'P0001'; end if;
  if new.status is distinct from old.status then
    if not is_self then raise exception 'ADMIN_ONLY' using errcode = 'P0001'; end if;
    new.participant_id := auth.uid();
  end if;
  if (new.role is distinct from old.role or new.is_substitute is distinct from old.is_substitute)
     and not exists (select 1 from public.teams t where t.id = old.team_id and t.captain_id = auth.uid()) then
    raise exception 'ADMIN_ONLY' using errcode = 'P0001'; end if;
  return new;
end $$;
create trigger team_members_update_guard before update on public.team_members
  for each row execute function public.team_members_update_guard();
