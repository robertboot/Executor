// =========================================================================
// Edge Function: executor-unlock
//
// Verifies an executor access code (compared against bcrypt hashes server-side)
// and returns sanitized item + inventory data for the QR landing page.
//
// Deploy:
//   supabase functions deploy executor-unlock --no-verify-jwt
//
// The --no-verify-jwt flag is REQUIRED: this endpoint is called from
// anonymous QR landing-page visitors who don't have a Supabase session.
// We do our own authorization (the executor code itself).
// =========================================================================

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

interface RequestBody {
  public_id: string;
  code: string;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

function bad(status: number, error: string) {
  return new Response(JSON.stringify({ error }), { status, headers: corsHeaders });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return bad(405, "Method not allowed");

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return bad(400, "Invalid JSON");
  }

  const publicId = String(body.public_id ?? "").trim();
  const code = String(body.code ?? "").trim();
  if (!publicId || !code) return bad(400, "public_id and code are required");

  // Find the item by public_id (admin client — bypasses RLS).
  const { data: item, error: itemErr } = await supabase
    .from("items")
    .select(
      `
      id, inventory_id, name, category, description, condition, location,
      value_amount, value_currency, notes, provenance, acquired_date,
      intended_recipient_name, intended_recipient_contact, bequest_notes,
      custom_fields, public_id, created_at, updated_at
    `,
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (itemErr) return bad(500, itemErr.message);
  if (!item) return bad(404, "Item not found");

  // Find all non-revoked executor codes for this item's inventory.
  const { data: codes, error: codeErr } = await supabase
    .from("executor_codes")
    .select("id, code_hash, revoked, inventory_id")
    .eq("inventory_id", item.inventory_id)
    .eq("revoked", false);

  if (codeErr) return bad(500, codeErr.message);

  // Verify the supplied code against any stored hash via crypt() in Postgres.
  // We do this via an RPC because bcrypt verification belongs server-side.
  let matchedCodeId: string | null = null;
  for (const c of codes ?? []) {
    const { data: ok, error: verifyErr } = await supabase.rpc("verify_bcrypt", {
      plain: code,
      hash: c.code_hash,
    });
    if (verifyErr) return bad(500, verifyErr.message);
    if (ok === true) {
      matchedCodeId = c.id;
      break;
    }
  }

  if (!matchedCodeId) return bad(401, "Invalid or revoked code");

  // Log the access.
  await supabase.from("executor_access_log").insert({
    executor_code_id: matchedCodeId,
    item_public_id: publicId,
    user_agent: req.headers.get("user-agent") ?? null,
  });
  await supabase
    .from("executor_codes")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", matchedCodeId);

  // Inventory metadata (read-only).
  const { data: inventory } = await supabase
    .from("inventories")
    .select("id, name, description")
    .eq("id", item.inventory_id)
    .maybeSingle();

  // All items in the inventory (read-only summary).
  const { data: siblingItems } = await supabase
    .from("items")
    .select(
      "id, name, category, value_amount, value_currency, public_id, intended_recipient_name",
    )
    .eq("inventory_id", item.inventory_id)
    .order("name");

  // Photos for the scanned item, plus signed/public URLs.
  const { data: photos } = await supabase
    .from("item_photos")
    .select("storage_path, caption, sort_order")
    .eq("item_id", item.id)
    .order("sort_order");

  const photoUrls = (photos ?? []).map((p) => ({
    caption: p.caption,
    url: supabase.storage.from("item-photos").getPublicUrl(p.storage_path).data
      .publicUrl,
  }));

  return new Response(
    JSON.stringify({
      item,
      inventory,
      photos: photoUrls,
      sibling_items: siblingItems ?? [],
    }),
    { status: 200, headers: corsHeaders },
  );
});
