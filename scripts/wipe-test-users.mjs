// One-shot pre-launch nuke. Wipes the users + canvases tables and empties
// the canvases storage bucket. Idempotent — running it twice does nothing
// the second time.
//
// Doesn't touch Clerk (do that from clerk.com dashboard) or Stripe
// (customers there auto-recreate on next checkout).
//
// Usage:
//   SUPABASE_URL=https://...supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
//   node scripts/wipe-test-users.mjs --yes
//
// The --yes flag is required so this can never run by accident from a
// test or CI step. Without it, the script prints a summary and exits.

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const dryRun = !process.argv.includes("--yes");
const sb = createClient(url, key, { auth: { persistSession: false } });

async function listBucket() {
  // List with a high limit; canvas-buddy at launch shouldn't have anywhere
  // near 1000 objects. Recurses one level deep (user-id subfolders).
  const { data: rootEntries, error } = await sb.storage
    .from("canvases")
    .list("", { limit: 1000 });
  if (error) throw error;

  const all = [];
  for (const entry of rootEntries ?? []) {
    if (entry.name && entry.metadata) {
      // File at root.
      all.push(entry.name);
    } else if (entry.name) {
      // Folder — recurse one level (user_id/canvas_id/file).
      const { data: subEntries } = await sb.storage
        .from("canvases")
        .list(entry.name, { limit: 1000 });
      for (const sub of subEntries ?? []) {
        if (sub.name && sub.metadata) {
          all.push(`${entry.name}/${sub.name}`);
        } else if (sub.name) {
          const { data: leafEntries } = await sb.storage
            .from("canvases")
            .list(`${entry.name}/${sub.name}`, { limit: 1000 });
          for (const leaf of leafEntries ?? []) {
            if (leaf.name) all.push(`${entry.name}/${sub.name}/${leaf.name}`);
          }
        }
      }
    }
  }
  return all;
}

const { data: usersBefore } = await sb.from("users").select("id, email", { count: "exact" });
const { data: canvasesBefore } = await sb.from("canvases").select("id", { count: "exact" });
const objectsBefore = await listBucket();

console.log(`users:     ${usersBefore?.length ?? 0}`);
console.log(`canvases:  ${canvasesBefore?.length ?? 0}`);
console.log(`storage:   ${objectsBefore.length} objects`);
if (usersBefore?.length) {
  console.log("\nemails:");
  for (const u of usersBefore) console.log(`  - ${u.email || "(no email)"} [${u.id}]`);
}

if (dryRun) {
  console.log("\n(dry run — re-run with --yes to actually wipe)");
  process.exit(0);
}

console.log("\nwiping...");

// Storage first — once the rows are gone we can't reconstruct keys for
// orphaned objects. (Storage delete tolerates 0 keys.)
if (objectsBefore.length) {
  const { error } = await sb.storage.from("canvases").remove(objectsBefore);
  if (error) throw error;
  console.log(`✓ removed ${objectsBefore.length} storage objects`);
}

// canvases first (has FK to users), then users.
const { error: cErr } = await sb.from("canvases").delete().not("id", "is", null);
if (cErr) throw cErr;
console.log("✓ deleted all canvases rows");

const { error: uErr } = await sb.from("users").delete().not("id", "is", null);
if (uErr) throw uErr;
console.log("✓ deleted all users rows");

console.log("\ndone. don't forget to bulk-delete users in clerk.com dashboard.");
