import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser, sanitizeRedirect } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Register | Noordons Books",
  description: "Create a Noordons Books account.",
};

const errorMessages: Record<string, string> = {
  db: "MongoDB must be configured before registration can work.",
  exists: "An account with that email already exists.",
  invalid: "Provide a name, a valid email, and a password with at least 8 characters.",
  reserved: "That email is reserved for the admin account.",
};

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const [currentUser, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (currentUser) {
    redirect(currentUser.role === "admin" ? "/admin" : "/dashboard");
  }

  const next = sanitizeRedirect(params.next, "/dashboard");
  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="page-frame">
      <section className="section-panel px-6 py-10 sm:px-8">
        <p className="section-kicker">Register</p>
        <h1 className="mt-4 font-serif text-5xl leading-none text-[#1b140f] sm:text-6xl">
          Create your reader account.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-[#5d493d]">
          Registration creates a standard user account and signs you in
          immediately. Your dashboard will use the same email for order history.
        </p>

        {errorMessage ? (
          <div className="mt-6 rounded-[1.5rem] border border-[#b36c61]/30 bg-[#fff1ee] p-5">
            <p className="text-sm leading-7 text-[#7f463f]">{errorMessage}</p>
          </div>
        ) : null}

        <form action="/api/auth/register" method="post" className="mt-8 space-y-4">
          <input type="hidden" name="next" value={next} />
          <input
            type="text"
            name="name"
            placeholder="Full name"
            className="input-shell"
            required
          />
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
            minLength={8}
            className="input-shell"
            required
          />
          <button type="submit" className="btn-primary">
            Create account
          </button>
        </form>

        <p className="mt-6 text-sm leading-7 text-[#5d493d]">
          Already have an account?{" "}
          <Link href="/login" className="nav-link">
            Login here
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
