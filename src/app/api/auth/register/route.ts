import { NextResponse } from "next/server";

import {
  type SessionUser,
  applySessionCookieToResponse,
  registerUser,
  sanitizeRedirect,
} from "@/lib/auth";
import { isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";

function redirectWithError(request: Request, code: string, next?: string | null) {
  const url = new URL("/register", request.url);
  url.searchParams.set("error", code);

  if (next) {
    url.searchParams.set("next", next);
  }

  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
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

  if (!name || !email || password.length < 8) {
    return redirectWithError(request, "invalid", next);
  }

  const user: SessionUser | Error = await registerUser({
    name,
    email,
    password,
  }).catch(
    (error: unknown) =>
      error instanceof Error ? error : new Error("Registration failed."),
  );

  if (user instanceof Error) {
    if (user.message.includes("reserved")) {
      return redirectWithError(request, "reserved", next);
    }

    if (user.message.includes("exists")) {
      return redirectWithError(request, "exists", next);
    }

    return redirectWithError(request, "db", next);
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  await applySessionCookieToResponse(response, user);
  return response;
}
