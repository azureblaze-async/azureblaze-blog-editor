import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabase } from "./supabase";

/** Validate both identity and the existing allowlist using the caller's token, never a service key. */
export async function verifyMediaAdmin(url: string, key: string, authorization: string | undefined) {
  if (!authorization?.startsWith("Bearer ")) throw new Error("Sign in before uploading an image.");
  const headers = { apikey: key, Authorization: authorization };
  const user = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, { headers });
  if (!user.ok) throw new Error("Your session expired. Sign in again before uploading.");
  const identity = await user.json() as { id?: string };
  if (!identity.id) throw new Error("Invalid session.");
  const admin = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/is_admin`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: "{}",
  });
  if (!admin.ok || await admin.json() !== true) throw new Error("Only an authorized editor can upload images.");
}

export const requireMediaAdmin = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { data, error } = await requireSupabase().auth.getSession();
    if (error || !data.session) throw new Error("Sign in before uploading an image.");
    return next({ headers: { Authorization: `Bearer ${data.session.access_token}` } });
  })
  .server(async ({ next }) => {
    const url = process.env["SUPABASE_URL"] ?? import.meta.env["VITE_SUPABASE_URL"];
    const key = process.env["SUPABASE_ANON_KEY"] ?? import.meta.env["VITE_SUPABASE_ANON_KEY"];
    if (!url || !key) throw new Error("Configure the Supabase URL and public key before uploading.");
    await verifyMediaAdmin(url, key, getRequestHeader("Authorization"));
    return next();
  });