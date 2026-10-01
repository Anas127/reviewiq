alter table public.profiles alter column credits set default 5;

create table if not exists public.pending_credits (
  email text primary key,
  credits integer not null default 0 check (credits >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  event_id text primary key,
  provider text not null check (provider = 'gumroad'),
  event_type text not null,
  buyer_email text not null,
  sale_id text,
  subscription_id text,
  processed_at timestamptz not null default now()
);

create table if not exists public.gumroad_subscriptions (
  subscription_id text primary key,
  email text not null,
  status text not null check (status in ('active', 'cancelled', 'ended')),
  updated_at timestamptz not null default now()
);

alter table public.pending_credits enable row level security;
alter table public.payment_events enable row level security;
alter table public.gumroad_subscriptions enable row level security;

revoke all on public.pending_credits from anon, authenticated;
revoke all on public.payment_events from anon, authenticated;
revoke all on public.gumroad_subscriptions from anon, authenticated;

create or replace function public.handle_gumroad_event(
  p_event_id text,
  p_event_type text,
  p_email text,
  p_sale_id text,
  p_subscription_id text,
  p_credits integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(btrim(p_email));
  current_status text;
  updated_count integer;
begin
  if normalized_email = '' or p_event_id = '' or p_subscription_id = '' then
    raise exception 'Gumroad event is missing required identifiers';
  end if;

  if p_event_type not in ('sale', 'cancellation', 'subscription_ended', 'subscription_restarted') then
    raise exception 'Unsupported Gumroad event type';
  end if;

  if (p_event_type = 'sale' and p_credits <> 10)
    or (p_event_type <> 'sale' and p_credits <> 0) then
    raise exception 'Invalid credit amount for Gumroad event';
  end if;

  if p_event_type <> 'sale' and not exists (
    select 1 from public.gumroad_subscriptions
    where subscription_id = p_subscription_id
      and email = normalized_email
  ) then
    return 'unknown_subscription';
  end if;

  insert into public.payment_events (
    event_id, provider, event_type, buyer_email, sale_id, subscription_id
  ) values (
    p_event_id, 'gumroad', p_event_type, normalized_email, p_sale_id, p_subscription_id
  ) on conflict (event_id) do nothing;

  get diagnostics updated_count = row_count;
  if updated_count = 0 then
    return 'duplicate';
  end if;

  if p_event_type = 'sale' then
    insert into public.gumroad_subscriptions (subscription_id, email, status)
    values (p_subscription_id, normalized_email, 'active')
    on conflict (subscription_id) do nothing;

    select status into current_status
    from public.gumroad_subscriptions
    where subscription_id = p_subscription_id
    for update;

    if current_status <> 'active' then
      return 'inactive_subscription';
    end if;

    update public.profiles
    set credits = credits + p_credits
    where lower(btrim(email)) = normalized_email;

    get diagnostics updated_count = row_count;
    if updated_count = 0 then
      insert into public.pending_credits (email, credits)
      values (normalized_email, p_credits)
      on conflict (email) do update
        set credits = public.pending_credits.credits + excluded.credits,
            updated_at = now();
      return 'pending';
    end if;

    return 'credited';
  end if;

  update public.gumroad_subscriptions
  set status = case when p_event_type = 'subscription_restarted' then 'active'
      when p_event_type = 'subscription_ended' then 'ended'
      else 'cancelled' end,
      updated_at = now()
  where subscription_id = p_subscription_id
    and email = normalized_email;

  return 'subscription_updated';
end;
$$;

revoke all on function public.handle_gumroad_event(text, text, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.handle_gumroad_event(text, text, text, text, text, integer) to service_role;

create or replace function public.apply_pending_credits_to_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  applied_count integer;
begin
  update public.profiles as profile
  set credits = profile.credits + pending.credits
  from public.pending_credits as pending
  where profile.id = new.id
    and pending.email = lower(btrim(new.email));

  get diagnostics applied_count = row_count;
  if applied_count > 0 then
    delete from public.pending_credits
    where email = lower(btrim(new.email));
  end if;

  return new;
end;
$$;

drop trigger if exists apply_pending_credits_after_profile_insert on public.profiles;
create trigger apply_pending_credits_after_profile_insert
after insert on public.profiles
for each row execute function public.apply_pending_credits_to_profile();

create or replace function public.complete_review(
  p_role text,
  p_language text,
  p_seniority text,
  p_code text,
  p_bugs jsonb,
  p_user_review text,
  p_score integer,
  p_caught jsonb,
  p_missed jsonb,
  p_feedback text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  review_user_id uuid := auth.uid();
  updated_count integer;
begin
  if review_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.profiles
  set credits = credits - 1
  where id = review_user_id and credits > 0;

  get diagnostics updated_count = row_count;
  if updated_count = 0 then
    return false;
  end if;

  insert into public.reviews (
    user_id, role, language, seniority, code, bugs,
    user_review, score, caught, missed, feedback
  ) values (
    review_user_id, p_role, p_language, p_seniority, p_code, p_bugs,
    p_user_review, p_score, p_caught, p_missed, p_feedback
  );

  return true;
end;
$$;

revoke all on function public.complete_review(text, text, text, text, jsonb, text, integer, jsonb, jsonb, text) from public, anon;
grant execute on function public.complete_review(text, text, text, text, jsonb, text, integer, jsonb, jsonb, text) to authenticated;
