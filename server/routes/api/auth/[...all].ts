/**
 * Mounts Better Auth at /api/auth/* (get-session, sign-in/social,
 * callback/discord, sign-out, …). Without this route the client's calls to
 * those paths 404 — which is why the login button did nothing: it always
 * ran, but the redirect it asked for never came back.
 *
 * h3 v2's `event.req` is already a standard Request, and Better Auth's
 * `auth.handler` takes one and returns a Response, so this is a straight
 * pass-through. Matches every method (GET for get-session/callback, POST for
 * sign-in/sign-out) because the filename has no `.get`/`.post` suffix.
 */
import { defineEventHandler } from "h3";
import { auth } from "@/lib/auth/server";

export default defineEventHandler((event) => auth.handler(event.req));
