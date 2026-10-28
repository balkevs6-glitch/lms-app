-- Allow a project member to view the public profile of every member
-- in that same project without weakening project_members RLS.
create or replace function public.get_project_members(p_project_id bigint) returns table (
        user_id uuid,
        name text,
        avatar_url text,
        role text,
        joined_at timestamptz
    ) language sql security definer
set search_path = public as $$
select pm.user_id,
    u.name,
    u.avatar_url,
    pm.role,
    pm.joined_at
from public.project_members as pm
    join public.users as u on u.id = pm.user_id
where pm.project_id = p_project_id
    and exists (
        select 1
        from public.project_members as viewer_membership
        where viewer_membership.project_id = p_project_id
            and viewer_membership.user_id = auth.uid()
    )
order by pm.joined_at asc;
$$;
revoke all on function public.get_project_members(bigint)
from public;
grant execute on function public.get_project_members(bigint) to authenticated;

create or replace function public.remove_project_member(
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