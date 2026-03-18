import type { Address } from "@/types/address";

type PartialAddress = Partial<Address> | null | undefined;
type StripeAddressLike = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function normalizeAddress(input: PartialAddress) {
  if (!input) {
    return null;
  }

  const address = {
    fullName: normalizeText(input.fullName),
    company: normalizeText(input.company) || undefined,
    line1: normalizeText(input.line1),
    line2: normalizeText(input.line2) || undefined,
    city: normalizeText(input.city),
    state: normalizeText(input.state),
    postalCode: normalizeText(input.postalCode),
    country: normalizeText(input.country).toUpperCase(),
    phone: normalizeText(input.phone) || undefined,
  } satisfies Address;

  if (
    !address.fullName ||
    !address.line1 ||
    !address.city ||
    !address.state ||
    !address.postalCode ||
    !address.country
  ) {
    return null;
  }

  if (address.country.length !== 2) {
    return null;
  }

  return address;
}

export function parseRequiredAddress(input: PartialAddress, label: string) {
  const address = normalizeAddress(input);

  if (!address) {
    throw new Error(
      `${label} is incomplete. Provide full name, line 1, city, state, postal code, and a two-letter country code.`,
    );
  }

  return address;
}

export function formatAddressLines(address: Address | null | undefined) {
  if (!address) {
    return [];
  }

  const lines = [
    address.fullName,
    address.company,
    [address.line1, address.line2].filter(Boolean).join(", "),
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
    address.phone,
  ];

  return lines.filter(Boolean) as string[];
}

export function serializeAddressToMetadata(
  prefix: "billing" | "shipping",
  address: Address,
) {
  return {
    [`${prefix}FullName`]: address.fullName,
    [`${prefix}Company`]: address.company ?? "",
    [`${prefix}Line1`]: address.line1,
    [`${prefix}Line2`]: address.line2 ?? "",
    [`${prefix}City`]: address.city,
    [`${prefix}State`]: address.state,
    [`${prefix}PostalCode`]: address.postalCode,
    [`${prefix}Country`]: address.country,
    [`${prefix}Phone`]: address.phone ?? "",
  } as Record<string, string>;
}

export function readAddressFromMetadata(
  prefix: "billing" | "shipping",
  metadata: Record<string, string | null | undefined> | null | undefined,
) {
  return normalizeAddress({
    fullName: metadata?.[`${prefix}FullName`] ?? undefined,
    company: metadata?.[`${prefix}Company`] ?? undefined,
    line1: metadata?.[`${prefix}Line1`] ?? undefined,
    line2: metadata?.[`${prefix}Line2`] ?? undefined,
    city: metadata?.[`${prefix}City`] ?? undefined,
    state: metadata?.[`${prefix}State`] ?? undefined,
    postalCode: metadata?.[`${prefix}PostalCode`] ?? undefined,
    country: metadata?.[`${prefix}Country`] ?? undefined,
    phone: metadata?.[`${prefix}Phone`] ?? undefined,
  });
}

export function addressFromStripe(
  address: StripeAddressLike | null | undefined,
  options: {
    fullName?: string | null;
    company?: string | null;
    phone?: string | null;
  } = {},
) {
  if (!address) {
    return null;
  }

  return normalizeAddress({
    fullName: options.fullName ?? undefined,
    company: options.company ?? undefined,
    line1: address.line1 ?? undefined,
    line2: address.line2 ?? undefined,
    city: address.city ?? undefined,
    state: address.state ?? undefined,
    postalCode: address.postal_code ?? undefined,
    country: address.country ?? undefined,
    phone: options.phone ?? undefined,
  });
}
