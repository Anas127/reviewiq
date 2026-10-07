-- Credit amounts are supplied by the application's canonical entitlement
-- configuration. The database applies that amount atomically and does not
-- maintain a second hardcoded Pro allowance.
alter table public.profiles alter column credits set default 5;

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

  if (p_event_type = 'sale' and (p_credits is null or p_credits <= 0))
    or (p_event_type <> 'sale' and (p_credits is null or p_credits <> 0)) then
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

revoke all on function public.handle_gumroad_event(text, text, text, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.handle_gumroad_event(text, text, text, text, text, integer)
  to service_role;
