-- Private bucket holding rendered canvas MP4s and thumbnail JPEGs.
-- Layout: <user_id>/<canvas_id>/canvas.mp4 and <user_id>/<canvas_id>/thumb.jpg
-- Access: server-side only (service role) — the API issues signed URLs to the browser.

insert into storage.buckets (id, name, public)
values ('canvases', 'canvases', false)
on conflict (id) do nothing;
