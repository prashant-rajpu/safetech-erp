#!/bin/sh
# Phase 2 live-Supabase acceptance proof. Run AFTER the 3 DDL files
# (init.sql, erp_schema.sql, rls_policies.sql) have been applied in the
# Supabase SQL Editor. Keys are read from env so no secret is stored on disk:
#   URL=... ANON=... SECRET=... sh phase2_acceptance.sh
set -u
: "${URL:?set URL}"; : "${ANON:?set ANON}"; : "${SECRET:?set SECRET}"
PW='SafetechPhase2!'

ADMIN_ID=d77456b0-a2a8-4805-8e96-6b8a227ed552
GATE_ID=f30444a8-cd85-467b-bc6d-bbdaa1ca6712
SUP_ID=0d0bf0f9-7fd0-4071-87a7-660beb9381ec
VIEW_ID=4534583f-0e0e-4eca-ad6a-250b845e4b06

echo "── 1. Seed public.users (service role, bypasses RLS) ──"
curl -s -X POST "$URL/rest/v1/users" \
  -H "apikey: $SECRET" -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates,return=representation" \
  -d "[
    {\"id\":\"$ADMIN_ID\",\"email\":\"admin@safetech.ae\",\"role\":\"admin\",\"department\":\"management\"},
    {\"id\":\"$GATE_ID\",\"email\":\"gate@safetech.ae\",\"role\":\"controller\",\"department\":\"dispatch\"},
    {\"id\":\"$SUP_ID\",\"email\":\"production@safetech.ae\",\"role\":\"supervisor\",\"department\":\"production\"},
    {\"id\":\"$VIEW_ID\",\"email\":\"viewer@safetech.ae\",\"role\":\"viewer\",\"department\":\"management\"}
  ]" | head -c 400
echo ""

# helper: sign in, echo access_token
signin() {
  curl -s -X POST "$URL/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$PW\"}" \
  | grep -o '"access_token":"[^"]*"' | head -1 | sed 's/"access_token":"//;s/"//'
}

VIEW_JWT=$(signin viewer@safetech.ae)
GATE_JWT=$(signin gate@safetech.ae)
ADMIN_JWT=$(signin admin@safetech.ae)
echo "tokens: viewer=${VIEW_JWT:+ok} gate=${GATE_JWT:+ok} admin=${ADMIN_JWT:+ok}"

echo ""
echo "── 2. viewer CAN read elements (has planning view) ──"
curl -s -o /dev/null -w "  GET elements: HTTP %{http_code}\n" \
  "$URL/rest/v1/elements?select=element_code&limit=1" -H "apikey: $ANON" -H "Authorization: Bearer $VIEW_JWT"

echo "── 3. viewer CANNOT insert (RLS must reject) ──"
curl -s -w "\n  -> HTTP %{http_code}\n" -X POST "$URL/rest/v1/elements" \
  -H "apikey: $ANON" -H "Authorization: Bearer $VIEW_JWT" -H "Content-Type: application/json" \
  -d '[{"element_code":"RLS-TEST-VIEWER"}]' | head -c 300

echo "── 4. viewer CANNOT read audit_logs (admin-only), CANNOT write roles ──"
curl -s -o /dev/null -w "  GET audit_logs as viewer: HTTP %{http_code} (expect 200 + empty)\n" \
  "$URL/rest/v1/audit_logs?select=id&limit=1" -H "apikey: $ANON" -H "Authorization: Bearer $VIEW_JWT"
curl -s -w "  POST roles as viewer -> HTTP %{http_code}\n" -o /dev/null -X POST "$URL/rest/v1/roles" \
  -H "apikey: $ANON" -H "Authorization: Bearer $VIEW_JWT" -H "Content-Type: application/json" \
  -d '[{"role_key":"hacker","label":"nope"}]'

echo "── 5. controller CAN insert dispatch + set gate flags; check trigger ──"
curl -s -w "\n  controller insert dispatch_log -> HTTP %{http_code}\n" -X POST "$URL/rest/v1/dispatch_log" \
  -H "apikey: $ANON" -H "Authorization: Bearer $GATE_JWT" -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[{"do_no":"RLS-GATE-CTRL","diesel_status":true,"driver_status":true}]' | head -c 300

echo "── 6. viewer insert into dispatch_log rejected (no dispatch create) ──"
curl -s -w "\n  viewer insert dispatch_log -> HTTP %{http_code}\n" -X POST "$URL/rest/v1/dispatch_log" \
  -H "apikey: $ANON" -H "Authorization: Bearer $VIEW_JWT" -H "Content-Type: application/json" \
  -d '[{"do_no":"RLS-GATE-VIEWER"}]' | head -c 300

echo "── 7. has_permission via admin (sanity) ──"
curl -s -X POST "$URL/rest/v1/rpc/has_permission" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  -d '{"p_section":"admin","p_action":"edit"}' -w " (admin admin/edit)\n"
curl -s -X POST "$URL/rest/v1/rpc/has_permission" \
  -H "apikey: $ANON" -H "Authorization: Bearer $VIEW_JWT" -H "Content-Type: application/json" \
  -d '{"p_section":"dispatch","p_action":"approve"}' -w " (viewer dispatch/approve)\n"

echo ""
echo "── cleanup test rows (service role) ──"
curl -s -o /dev/null -X DELETE "$URL/rest/v1/dispatch_log?do_no=like.RLS-GATE-*" -H "apikey: $SECRET" -H "Authorization: Bearer $SECRET"
curl -s -o /dev/null -X DELETE "$URL/rest/v1/elements?element_code=like.RLS-TEST-*" -H "apikey: $SECRET" -H "Authorization: Bearer $SECRET"
echo "done"
