"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Address } from "@/types/address";

type AccountAddressesFormProps = {
  billingAddress: Address | null;
  shippingAddress: Address | null;
};

type AddressFields = {
  fullName: string;
  company: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
};

type FormStatus = {
  error: string | null;
  success: string | null;
};

function createAddressFields(address: Address | null): AddressFields {
  return {
    fullName: address?.fullName ?? "",
    company: address?.company ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    postalCode: address?.postalCode ?? "",
    country: address?.country ?? "US",
    phone: address?.phone ?? "",
  };
}

function AddressFieldset({
  title,
  value,
  onChange,
}: {
  title: string;
  value: AddressFields;
  onChange: (field: keyof AddressFields, nextValue: string) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-white/50 p-5">
      <p className="section-kicker">{title}</p>
      <div className="mt-4 grid gap-4">
        <input
          type="text"
          value={value.fullName}
          onChange={(event) => onChange("fullName", event.target.value)}
          placeholder="Full name"
          className="input-shell"
        />
        <input
          type="text"
          value={value.company}
          onChange={(event) => onChange("company", event.target.value)}
          placeholder="Company (optional)"
          className="input-shell"
        />
        <input
          type="text"
          value={value.line1}
          onChange={(event) => onChange("line1", event.target.value)}
          placeholder="Address line 1"
          className="input-shell"
        />
        <input
          type="text"
          value={value.line2}
          onChange={(event) => onChange("line2", event.target.value)}
          placeholder="Address line 2 (optional)"
          className="input-shell"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="text"
            value={value.city}
            onChange={(event) => onChange("city", event.target.value)}
            placeholder="City"
            className="input-shell"
          />
          <input
            type="text"
            value={value.state}
            onChange={(event) => onChange("state", event.target.value)}
            placeholder="State / region"
            className="input-shell"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="text"
            value={value.postalCode}
            onChange={(event) => onChange("postalCode", event.target.value)}
            placeholder="Postal code"
            className="input-shell"
          />
          <input
            type="text"
            value={value.country}
            onChange={(event) => onChange("country", event.target.value.toUpperCase())}
            placeholder="Country code (US)"
            maxLength={2}
            className="input-shell uppercase"
          />
        </div>
        <input
          type="text"
          value={value.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder="Phone (optional)"
          className="input-shell"
        />
      </div>
    </div>
  );
}

export function AccountAddressesForm({
  billingAddress,
  shippingAddress,
}: AccountAddressesFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [billing, setBilling] = useState<AddressFields>(
    createAddressFields(billingAddress),
  );
  const [shipping, setShipping] = useState<AddressFields>(
    createAddressFields(shippingAddress),
  );
  const [status, setStatus] = useState<FormStatus>({
    error: null,
    success: null,
  });

  function updateBilling(field: keyof AddressFields, value: string) {
    setBilling((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateShipping(field: keyof AddressFields, value: string) {
    setShipping((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function copyBillingToShipping() {
    setShipping(billing);
    setStatus({
      error: null,
      success: "Billing address copied into shipping.",
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      setStatus({ error: null, success: null });

      try {
        const response = await fetch("/api/account/addresses", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            billingAddress: billing,
            shippingAddress: shipping,
          }),
        });

        const payload = (await response.json()) as {
          message?: string;
          billingAddress?: Address;
          shippingAddress?: Address;
        };

        if (!response.ok) {
          throw new Error(payload.message || "Unable to save addresses.");
        }

        setStatus({
          error: null,
          success: payload.message || "Addresses saved.",
        });
        router.refresh();
      } catch (error) {
        setStatus({
          error: error instanceof Error ? error.message : "Unable to save addresses.",
          success: null,
        });
      }
    });
  }

  return (
    <section className="section-panel px-6 py-6 sm:px-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Saved addresses</p>
          <h2 className="mt-3 font-serif text-4xl leading-none text-[#1b140f]">
            Billing and shipping details for checkout.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5d493d]">
            These saved addresses are used to create your Stripe customer
            details and are copied into each order record for invoice and
            fulfillment reference.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={copyBillingToShipping}>
          Copy billing to shipping
        </button>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        <AddressFieldset
          title="Billing address"
          value={billing}
          onChange={updateBilling}
        />
        <AddressFieldset
          title="Shipping address"
          value={shipping}
          onChange={updateShipping}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? "Saving addresses..." : "Save addresses"}
        </button>
        {status.success ? (
          <p className="text-sm leading-7 text-[#3b6f4e]">{status.success}</p>
        ) : null}
        {status.error ? (
          <p className="text-sm leading-7 text-[#8f443f]">{status.error}</p>
        ) : null}
      </div>
    </section>
  );
}
