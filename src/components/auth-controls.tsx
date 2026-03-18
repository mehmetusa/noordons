"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AuthSessionUser = {
  email: string;
  name: string;
  role: "user" | "admin";
};

type AuthSessionState = {
  authenticated: boolean;
  user: AuthSessionUser | null;
};

export function AuthControls() {
  const [state, setState] = useState<AuthSessionState | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load auth session.");
        }

        const payload = (await response.json()) as AuthSessionState;

        if (isMounted) {
          setState(payload);
        }
      } catch {
        if (isMounted) {
          setState({ authenticated: false, user: null });
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!state) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="btn-secondary">
          Login
        </Link>
        <Link href="/register" className="btn-primary">
          Register
        </Link>
      </div>
    );
  }

  if (!state.authenticated || !state.user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="btn-secondary">
          Login
        </Link>
        <Link href="/register" className="btn-primary">
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden rounded-full border border-black/10 bg-white/50 px-4 py-3 text-right sm:block">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-[#8b6d5a]">
          Signed in
        </p>
        <p className="text-sm text-[#2f241d]">{state.user.name}</p>
      </div>

      <Link href="/dashboard" className="btn-secondary">
        Dashboard
      </Link>

      {state.user.role === "admin" ? (
        <Link href="/admin" className="btn-secondary">
          Admin
        </Link>
      ) : null}

      <form action="/api/auth/logout" method="post">
        <button type="submit" className="btn-primary">
          Logout
        </button>
      </form>
    </div>
  );
}
