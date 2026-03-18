import { NextResponse } from "next/server";

import {
  type SessionUser,
  applySessionCookieToResponse,
  authenticateUser,
  sanitizeRedirect,
} from "@/lib/auth";
import { isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";

function redirectWithError(request: Request, code: string, next?: string | null) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", code);

  if (next) {
    url.searchParams.set("next", next);
  }

  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeRedirect(
    typeof formData.get("next") === "string"
      ? String(formData.get("next"))
      : "/dashboard",
    "/dashboard",
  );

  if (!isMongoConfigured) {
    return redirectWithError(request, "db", next);
  }

  if (!email || !password) {
    return redirectWithError(request, "missing", next);
  }

  const user: SessionUser | Error | null = await authenticateUser(email, password).catch(
    (error: unknown) =>
      error instanceof Error ? error : new Error("Authentication failed."),
  );

  if (user instanceof Error) {
    return redirectWithError(request, "db", next);
  }

  if (!user) {
    return redirectWithError(request, "invalid", next);
  }

  const destination =
    user.role === "admin" && next === "/dashboard" ? "/admin" : next;
  const response = NextResponse.redirect(new URL(destination, request.url));
  await applySessionCookieToResponse(response, user);
  return response;
}
