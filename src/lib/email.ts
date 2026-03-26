import nodemailer from "nodemailer";

import { siteConfig } from "@/lib/site-config";

type ContactEmailInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

function readEnv(value: string | undefined) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSmtpConfig() {
  const smtpUrl = readEnv(process.env.SMTP_URL);

  if (smtpUrl) {
    return smtpUrl;
  }

  const host = readEnv(process.env.SMTP_HOST);
  const user = readEnv(process.env.SMTP_USER);
  const password = readEnv(process.env.SMTP_PASSWORD);

  if (!host || !user || !password) {
    return null;
  }

  const port = Number.parseInt(process.env.SMTP_PORT || "587", 10);
  const explicitSecure = readEnv(process.env.SMTP_SECURE);
  const secure =
    explicitSecure === undefined ? port === 465 : explicitSecure === "true";

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass: password,
    },
  };
}

function getContactToEmail() {
  return readEnv(process.env.CONTACT_TO_EMAIL) || siteConfig.email;
}

function getContactFromEmail() {
  return (
    readEnv(process.env.CONTACT_FROM_EMAIL) ||
    readEnv(process.env.SMTP_FROM_EMAIL) ||
    readEnv(process.env.SMTP_USER) ||
    siteConfig.email
  );
}

export function isEmailConfigured() {
  return getSmtpConfig() !== null;
}

export async function sendContactEmail(input: ContactEmailInput) {
  const smtpConfig = getSmtpConfig();

  if (!smtpConfig) {
    throw new Error("SMTP is not configured for contact email delivery.");
  }

  const transporter = nodemailer.createTransport(smtpConfig);
  const subject = `[Noordons Contact] ${input.subject}`;
  const text = [
    "New contact form submission",
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Reply-To: ${input.email}`,
    "",
    "Message:",
    input.message,
  ].join("\n");

  const html = `
    <div style="font-family: Georgia, serif; color: #1b140f; line-height: 1.6;">
      <h2 style="margin: 0 0 16px;">New contact form submission</h2>
      <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(input.name)}</p>
      <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(input.email)}</p>
      <p style="margin: 0 0 20px;"><strong>Reply-To:</strong> ${escapeHtml(
        input.email,
      )}</p>
      <p style="margin: 0 0 8px;"><strong>Message:</strong></p>
      <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; background: #f7f1e7; padding: 16px; border-radius: 16px;">${escapeHtml(
        input.message,
      )}</pre>
    </div>
  `;

  await transporter.sendMail({
    to: getContactToEmail(),
    from: getContactFromEmail(),
    replyTo: input.email,
    subject,
    text,
    html,
  });
}
