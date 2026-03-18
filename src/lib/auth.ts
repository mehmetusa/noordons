import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { normalizeAddress } from "@/lib/address";
import { dbConnect, isMongoConfigured } from "@/lib/mongodb";
import { UserModel, type UserDocument } from "@/models/User";
import type { Address } from "@/types/address";

export type UserRole = "user" | "admin";

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  stripeCustomerId: string | null;
  billingAddress: Address | null;
  shippingAddress: Address | null;
};

type RawUser = Partial<UserDocument> & {
  _id?: unknown;
};

const SESSION_COOKIE_NAME = "noordons_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const DEV_AUTH_SECRET = "noordons-dev-auth-secret-change-me";
const DEV_ADMIN_EMAIL = "admin@noordonsbooks.local";
const DEV_ADMIN_PASSWORD = "Admin123456!";
const DEV_ADMIN_NAME = "Noordons Admin";

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET || DEV_AUTH_SECRET;
  return new TextEncoder().encode(secret);
}

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

function normalizeUser(document: RawUser): SessionUser {
  return {
    userId: String(document._id ?? ""),
    email: document.email ?? "",
    name: document.name ?? "Noordons Reader",
    role: (document.role as UserRole | undefined) ?? "user",
    stripeCustomerId:
      typeof document.stripeCustomerId === "string"
        ? document.stripeCustomerId
        : null,
    billingAddress: normalizeAddress(document.billingAddress as Address | null),
    shippingAddress: normalizeAddress(document.shippingAddress as Address | null),
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function sanitizeRedirect(
  value: string | null | undefined,
  fallback: string,
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function getAdminBootstrapCredentials() {
  return {
    email: normalizeEmail(process.env.ADMIN_EMAIL || DEV_ADMIN_EMAIL),
    password: process.env.ADMIN_PASSWORD || DEV_ADMIN_PASSWORD,
    name: process.env.ADMIN_NAME || DEV_ADMIN_NAME,
    usingDefaults: !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD,
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  const token = await createSessionToken(user);

  cookieStore.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
}

export async function applySessionCookieToResponse(
  response: Response & {
    cookies: {
      set: (
        name: string,
        value: string,
        options: ReturnType<typeof getSessionCookieOptions>,
      ) => void;
    };
  },
  user: SessionUser,
) {
  const token = await createSessionToken(user);
  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

export function clearSessionCookieInResponse(response: {
  cookies: {
    set: (
      name: string,
      value: string,
      options: ReturnType<typeof getSessionCookieOptions>,
    ) => void;
  };
}) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
}

async function readSessionPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    const userId = payload.sub;
    const email = typeof payload.email === "string" ? payload.email : null;
    const name = typeof payload.name === "string" ? payload.name : null;
    const role =
      payload.role === "admin" || payload.role === "user" ? payload.role : null;

    if (!userId || !email || !name || !role) {
      return null;
    }

    return {
      userId,
      email,
      name,
      role,
      stripeCustomerId: null,
      billingAddress: null,
      shippingAddress: null,
    } satisfies SessionUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const sessionUser = await readSessionPayload();

  if (!sessionUser) {
    return null;
  }

  if (!isMongoConfigured) {
    return sessionUser;
  }

  try {
    await dbConnect();

    const user = await UserModel.findById(sessionUser.userId).lean();
    return user ? normalizeUser(user as RawUser) : sessionUser;
  } catch (error) {
    console.error("Failed to read current user from MongoDB.", error);
    return sessionUser;
  }
}

export async function requireCurrentUser(nextPath = "/dashboard") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

export async function requireAdminUser(nextPath = "/admin") {
  const user = await requireCurrentUser(nextPath);

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

export async function ensureAdminUser() {
  if (!isMongoConfigured) {
    throw new Error("MONGODB_URI is not configured.");
  }

  await dbConnect();

  const bootstrap = getAdminBootstrapCredentials();
  const adminUser = await UserModel.findOne({ email: bootstrap.email });

  if (adminUser) {
    const passwordMatches = await verifyPassword(
      bootstrap.password,
      adminUser.passwordHash,
    );

    if (
      adminUser.role !== "admin" ||
      adminUser.name !== bootstrap.name ||
      !passwordMatches
    ) {
      adminUser.role = "admin";
      adminUser.name = bootstrap.name;

      if (!passwordMatches) {
        adminUser.passwordHash = await hashPassword(bootstrap.password);
      }

      await adminUser.save();
    }

    return normalizeUser(adminUser.toObject() as RawUser);
  }

  const passwordHash = await hashPassword(bootstrap.password);
  const createdUser = await UserModel.create({
    name: bootstrap.name,
    email: bootstrap.email,
    passwordHash,
    role: "admin",
  });

  return normalizeUser(createdUser.toObject() as RawUser);
}

export async function authenticateUser(email: string, password: string) {
  if (!isMongoConfigured) {
    throw new Error("MONGODB_URI is not configured.");
  }

  await ensureAdminUser();
  await dbConnect();

  const normalizedEmail = normalizeEmail(email);
  const user = await UserModel.findOne({ email: normalizedEmail });

  if (!user) {
    return null;
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  return normalizeUser(user.toObject() as RawUser);
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  if (!isMongoConfigured) {
    throw new Error("MONGODB_URI is not configured.");
  }

  await ensureAdminUser();
  await dbConnect();

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;
  const adminEmail = getAdminBootstrapCredentials().email;

  if (email === adminEmail) {
    throw new Error("This email is reserved for the admin account.");
  }

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(password);
  const createdUser = await UserModel.create({
    name,
    email,
    passwordHash,
    role: "user",
  });

  return normalizeUser(createdUser.toObject() as RawUser);
}

export async function updateUserAddresses(
  userId: string,
  input: {
    billingAddress: Address;
    shippingAddress: Address;
  },
) {
  if (!isMongoConfigured) {
    throw new Error("MONGODB_URI is not configured.");
  }

  await dbConnect();

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        billingAddress: input.billingAddress,
        shippingAddress: input.shippingAddress,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  if (!updatedUser) {
    throw new Error("User not found.");
  }

  return normalizeUser(updatedUser as RawUser);
}

export async function updateUserStripeCustomerId(
  userId: string,
  stripeCustomerId: string,
) {
  if (!isMongoConfigured) {
    throw new Error("MONGODB_URI is not configured.");
  }

  await dbConnect();

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        stripeCustomerId,
      },
    },
    {
      new: true,
    },
  ).lean();

  if (!updatedUser) {
    throw new Error("User not found.");
  }

  return normalizeUser(updatedUser as RawUser);
}
