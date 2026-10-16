-- Website default language is English: division names Putra/Putri become Men/Women.
update public.sport_divisions set nama = 'Men' where nama = 'Putra';
update public.sport_divisions set nama = 'Women' where nama = 'Putri';
