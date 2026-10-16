-- Perbaiki rekursi RLS (teams <-> team_members <-> registrations): cek keanggotaan lewat fungsi security definer.
create function public.is_team_captain(p_team uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teams where id = p_team and captain_id = auth.uid());
$$;
create function public.is_team_member(p_team uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.team_members
                  where team_id = p_team
                    and (participant_id = auth.uid() or lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
$$;
revoke execute on function public.is_team_captain(uuid), public.is_team_member(uuid) from public, anon;
grant execute on function public.is_team_captain(uuid), public.is_team_member(uuid) to authenticated;

alter policy teams_read on public.teams using (captain_id = auth.uid() or public.is_sc_admin() or public.is_team_member(id));

alter policy members_read on public.team_members using (
  participant_id = auth.uid() or lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  or public.is_sc_admin() or public.is_team_captain(team_id));
alter policy members_captain_write on public.team_members with check (public.is_team_captain(team_id));
alter policy members_captain_delete on public.team_members using (public.is_team_captain(team_id) or public.is_sc_admin());
alter policy members_respond on public.team_members using (
  participant_id = auth.uid() or lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  or public.is_team_captain(team_id) or public.is_sc_admin());

alter policy reg_read on public.registrations using (
  participant_id = auth.uid() or public.is_sc_admin()
  or (team_id is not null and (public.is_team_captain(team_id) or public.is_team_member(team_id))));
alter policy reg_insert on public.registrations with check (
  participant_id = auth.uid() or (team_id is not null and public.is_team_captain(team_id)));
alter policy reg_update on public.registrations using (
  public.is_sc_admin() or participant_id = auth.uid() or (team_id is not null and public.is_team_captain(team_id)));
alter policy reg_delete on public.registrations using (
  public.is_sc_admin() or (status = 'pending' and (participant_id = auth.uid() or (team_id is not null and public.is_team_captain(team_id)))));

-- anon ikut mengevaluasi policy; fungsi ini mengembalikan false untuk anon (auth.uid() null) alih-alih error.
grant execute on function public.is_team_captain(uuid), public.is_team_member(uuid) to anon;
