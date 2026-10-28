-- Run this once in the SQL Editor of the same Supabase project used by the app.
-- This creates the RPC required by the Members modal.

drop function if exists public.remove_project_member(bigint, uuid);

create function public.remove_project_member(
    p_project_id bigint,
    p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    caller_role text;
    target_role text;
begin
    select pm.role::text
    into caller_role
    from public.project_members pm
    where pm.project_id = p_project_id
      and pm.user_id = auth.uid();

    if caller_role is distinct from 'maintainer' then
        raise exception 'Only a project maintainer can remove members';
    end if;

    if p_user_id = auth.uid() then
        raise exception 'You cannot remove yourself from this project';
    end if;

    select pm.role::text
    into target_role
    from public.project_members pm
    where pm.project_id = p_project_id
      and pm.user_id = p_user_id;

    if target_role is null then
        raise exception 'That user is not a member of this project';
    end if;

    if target_role <> 'contributor' then
        raise exception 'Only contributors can be removed';
    end if;

    delete from public.project_members
    where project_id = p_project_id
      and user_id = p_user_id;
end;
$$;

revoke all on function public.remove_project_member(bigint, uuid) from public;
grant execute on function public.remove_project_member(bigint, uuid) to authenticated;

notify pgrst, 'reload schema';

-- Confirm that PostgREST can see the exact function signature.
select
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'remove_project_member';
