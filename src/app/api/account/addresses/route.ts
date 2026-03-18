import { NextResponse } from "next/server";

import { getCurrentUser, updateUserAddresses } from "@/lib/auth";
import { parseRequiredAddress } from "@/lib/address";

export const runtime = "nodejs";

type AddressRequestBody = {
  billingAddress?: Record<string, string | undefined>;
  shippingAddress?: Record<string, string | undefined>;
};

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  let body: AddressRequestBody;

  try {
    body = (await request.json()) as AddressRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  try {
    const updatedUser = await updateUserAddresses(currentUser.userId, {
      billingAddress: parseRequiredAddress(body.billingAddress, "Billing address"),
      shippingAddress: parseRequiredAddress(
        body.shippingAddress,
        "Shipping address",
      ),
    });

    return NextResponse.json({
      message: "Billing and shipping addresses saved.",
      billingAddress: updatedUser.billingAddress,
      shippingAddress: updatedUser.shippingAddress,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to save addresses.",
      },
      { status: 400 },
    );
  }
}
