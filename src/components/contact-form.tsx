"use client";

import { type FormEvent, useState, useTransition } from "react";

import { web3FormsAccessKey, web3FormsEndpoint } from "@/lib/web3forms";

type ContactFormProps = {
  initialName?: string;
  initialEmail?: string;
};

type ContactFormState = {
  error: string | null;
  success: string | null;
};

type Web3FormsResponse = {
  success?: boolean;
  message?: string;
  body?: {
    message?: string;
  };
};

export function ContactForm({
  initialName = "",
  initialEmail = "",
}: ContactFormProps) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ContactFormState>({
    error: null,
    success: null,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const archivePayload = Object.fromEntries(formData.entries());

    startTransition(async () => {
      setState({ error: null, success: null });

      try {
        formData.set("access_key", web3FormsAccessKey);
        formData.set("from_name", "Noordons Books");
        formData.set("replyto", String(formData.get("email") || ""));

        const response = await fetch(web3FormsEndpoint, {
          method: "POST",
          body: formData,
        });

        const result = (await response.json()) as Web3FormsResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              result.body?.message ||
              "Unable to send your message.",
          );
        }

        void fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(archivePayload),
        }).catch((error) => {
          console.error("Failed to archive contact message locally.", error);
        });

        form.reset();
        setState({
          error: null,
          success:
            result.message ||
            result.body?.message ||
            "Your message has been sent to the shop.",
        });
      } catch (error) {
        setState({
          error:
            error instanceof Error ? error.message : "Unable to send your message.",
          success: null,
        });
      }
    });
  }

  return (
    <section className="section-panel px-6 py-6 sm:px-7">
      <p className="section-kicker">Contact form</p>
      <h2 className="mt-3 font-serif text-4xl leading-none text-[#1b140f]">
        Tell us what you need.
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5d493d]">
        Use this form for order questions, wholesale requests, author events, or
        book-club notes. Messages go straight to the shop inbox through
        Web3Forms and can also be archived in MongoDB for review.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
        <input
          type="checkbox"
          name="botcheck"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="text"
            name="name"
            defaultValue={initialName}
            placeholder="Your name"
            className="input-shell"
            required
          />
          <input
            type="email"
            name="email"
            defaultValue={initialEmail}
            placeholder="Email address"
            className="input-shell"
            required
          />
        </div>

        <input
          type="text"
          name="subject"
          placeholder="Subject"
          className="input-shell"
          required
        />

        <textarea
          name="message"
          placeholder="How can we help?"
          className="input-shell min-h-52 rounded-[1.75rem]"
          required
        />

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? "Sending..." : "Send message"}
          </button>
          {state.success ? (
            <p className="text-sm leading-7 text-[#3b6f4e]">{state.success}</p>
          ) : null}
          {state.error ? (
            <p className="text-sm leading-7 text-[#8f443f]">{state.error}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
