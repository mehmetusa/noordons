import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  return NextResponse.json({
    authenticated: Boolean(user),
    user: user
      ? {
          email: user.email,
          name: user.name,
          role: user.role,
        }
      : null,
  });
}
