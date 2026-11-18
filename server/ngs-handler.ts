/**
 * Shared handler for the NGS school quiz page (served at /ngs and anything under /ngs/).
 * The page is one self-contained HTML file (server/ngs-quiz.html), bundled into the server build
 * with `?raw` (same way the PWA install page is), so it works on the VPS and on Vercel.
 * It is school-only practice material: marked noindex and listed as Disallow in robots.txt.
 */
import { defineEventHandler } from "h3";
import quizHtml from "./ngs-quiz.html?raw";

export default defineEventHandler(
  () =>
    new Response(quizHtml, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
        "x-robots-tag": "noindex, nofollow",
      },
    }),
);
