alter table public.stylist_profiles
add column if not exists onboarding_completed boolean not null default false;

-- Preserve previous behavior (presence of a profile implied onboarding done) for existing rows.
update public.stylist_profiles
set onboarding_completed = true
where onboarding_completed = false;

