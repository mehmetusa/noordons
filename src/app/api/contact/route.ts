import { NextResponse } from "next/server";

import { getCurrentUser, normalizeEmail } from "@/lib/auth";
import { dbConnect, isMongoConfigured } from "@/lib/mongodb";
import { isEmailConfigured, sendContactEmail } from "@/lib/email";
import { ContactMessageModel } from "@/models/ContactMessage";

export const runtime = "nodejs";

type ContactRequestBody = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  let body: ContactRequestBody;

  try {
    body = (await request.json()) as ContactRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Invalid contact payload." },
      { status: 400 },
    );
  }

  const name = readString(body.name);
  const email = normalizeEmail(readString(body.email));
  const subject = readString(body.subject);
  const message = readString(body.message);

  if (name.length < 2) {
    return NextResponse.json(
      { message: "Please enter your name." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { message: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  if (subject.length < 3) {
    return NextResponse.json(
      { message: "Please enter a subject." },
      { status: 400 },
    );
  }

  if (message.length < 12) {
    return NextResponse.json(
      { message: "Please add a longer message so the team has context." },
      { status: 400 },
    );
  }

  if (message.length > 2500) {
    return NextResponse.json(
      { message: "Please keep the message under 2500 characters." },
      { status: 400 },
    );
  }

  const emailEnabled = isEmailConfigured();

  if (!emailEnabled && !isMongoConfigured) {
    return NextResponse.json(
      {
        message:
          "Contact delivery is not configured yet. Add SMTP settings or MongoDB storage before using the form.",
      },
      { status: 503 },
    );
  }

  const currentUser = await getCurrentUser();
  let savedMessage = false;

  if (isMongoConfigured) {
    try {
      await dbConnect();

      await ContactMessageModel.create({
        userId: currentUser?.userId,
        name,
        email,
        subject,
        message,
      });

      savedMessage = true;
    } catch (error) {
      console.error("Failed to store contact message.", error);
    }
  }

  if (!emailEnabled) {
    return NextResponse.json(
      {
        message: savedMessage
          ? "Your message was saved, but inbox delivery is not configured yet. Add SMTP settings to forward messages to info@noordons.com."
          : "Inbox delivery is not configured yet. Add SMTP settings to forward messages to info@noordons.com.",
      },
      { status: 503 },
    );
  }

  try {
    await sendContactEmail({
      name,
      email,
      subject,
      message,
    });
  } catch (error) {
    console.error("Failed to send contact email.", error);

    return NextResponse.json(
      {
        message: savedMessage
          ? "Your message was saved, but email delivery to info@noordons.com failed. Check your SMTP settings."
          : "Unable to deliver your message email right now. Check your SMTP settings.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      message: savedMessage
        ? "Message sent to info@noordons.com and archived in the shop inbox."
        : "Message sent to info@noordons.com.",
    },
    { status: 201 },
  );
}
