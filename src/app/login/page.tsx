import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser, sanitizeRedirect } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Login | Noordons Books",
  description: "Access your Noordons Books account.",
};

const errorMessages: Record<string, string> = {
  db: "MongoDB must be configured before login can work.",
  invalid: "The email or password did not match an account.",
  missing: "Enter both email and password.",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [currentUser, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (currentUser) {
    redirect(currentUser.role === "admin" ? "/admin" : "/dashboard");
  }

  const next = sanitizeRedirect(params.next, "/dashboard");
  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="page-frame">
      <section className="section-panel px-6 py-10 sm:px-8">
        <p className="section-kicker">Login</p>
        <h1 className="mt-4 font-serif text-5xl leading-none text-[#1b140f] sm:text-6xl">
          Sign in to your account.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-[#5d493d]">
          Use your registered email and password to access your reader dashboard.
          Admin access uses the bootstrap credentials defined in the environment.
        </p>

        {errorMessage ? (
          <div className="mt-6 rounded-[1.5rem] border border-[#b36c61]/30 bg-[#fff1ee] p-5">
            <p className="text-sm leading-7 text-[#7f463f]">{errorMessage}</p>
          </div>
        ) : null}

        <form action="/api/auth/login" method="post" className="mt-8 space-y-4">
          <input type="hidden" name="next" value={next} />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="input-shell"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input-shell"
            required
          />
          <button type="submit" className="btn-primary">
            Login
          </button>
        </form>

        <p className="mt-6 text-sm leading-7 text-[#5d493d]">
          Need an account?{" "}
          <Link href="/register" className="nav-link">
            Register here
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
