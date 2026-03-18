import { NextResponse } from "next/server";

import { clearSessionCookieInResponse, sanitizeRedirect } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const next = sanitizeRedirect(
    typeof formData.get("next") === "string" ? String(formData.get("next")) : "/",
    "/",
  );

  const response = NextResponse.redirect(new URL(next, request.url));
  clearSessionCookieInResponse(response);
  return response;
}
