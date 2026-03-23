// dbHelper.js — direct Supabase REST calls using anon key (bypasses JS client auth)
// Use this instead of supabase.from() for all writes, since the custom auth system
// doesn't set a session token on the Supabase JS client and RLS blocks writes.

const SUPABASE_URL = 'https://bkapxykeryzxbqpgjgab.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYXB4eWtlcnl6eGJxcGdqZ2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODE3NzgsImV4cCI6MjA4OTg1Nzc3OH0.-URU57ytulm82gnYfpSrOQ_i0e7qlwk0LKfGokDXmWA';

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

export async function dbInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || json?.error || 'Insert failed');
  return Array.isArray(json) ? json[0] : json;
}

export async function dbSelect(table, filters = {}, order = 'created_at.asc') {
  const params = Object.entries(filters)
    .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
    .join('&');
  const sep = params ? '&' : '';
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}${sep}order=${order}`;
  const res = await fetch(url, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  return res.json();
}

export async function dbUpdate(table, filters, data) {
  const params = Object.entries(filters)
    .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
    .join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  return res.ok;
}

export async function dbUpsert(table, data, onConflict) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${
    onConflict ? `?on_conflict=${onConflict}` : ''
  }`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || 'Upsert failed');
  return Array.isArray(json) ? json[0] : json;
}
