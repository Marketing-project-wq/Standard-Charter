-- Rapikan hak eksekusi hasil advisor: validate_roster hanya dipakai trigger (owner), tidak lewat REST.
revoke execute on function public.validate_roster(uuid) from public, anon, authenticated;
