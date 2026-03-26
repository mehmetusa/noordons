import { NextResponse } from "next/server";

import { getCurrentUser, normalizeEmail } from "@/lib/auth";
import { dbConnect, isMongoConfigured } from "@/lib/mongodb";
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

  if (!isMongoConfigured) {
    return NextResponse.json(
      { message: "Message accepted without local archiving." },
      { status: 202 },
    );
  }

  try {
    await dbConnect();

    const currentUser = await getCurrentUser();

    await ContactMessageModel.create({
      userId: currentUser?.userId,
      name,
      email,
      subject,
      message,
    });

    return NextResponse.json(
      { message: "Message archived in the shop inbox." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to store contact message.", error);

    return NextResponse.json(
      { message: "Unable to archive your message right now." },
      { status: 500 },
    );
  }
}
