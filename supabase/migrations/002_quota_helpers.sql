-- Atomic counters for quota tracking. Avoids the read-modify-write race
-- where two concurrent renders could both see "videos_used = 4" and both
-- save "videos_used = 5", letting the user exceed the limit by one.

create or replace function increment_videos_used(uid text)
returns void as $$
begin
  update users
    set videos_used_this_period = videos_used_this_period + 1
    where id = uid;
end;
$$ language plpgsql security definer;

create or replace function increment_ai_generations_used(uid text)
returns void as $$
begin
  update users
    set ai_generations_used_this_period = ai_generations_used_this_period + 1
    where id = uid;
end;
$$ language plpgsql security definer;
