export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const API_KEY = process.env.SEARCHLEADS_API_KEY;
  const url = "https://pro.searchleads.co/functions/v1/people-search";
  const body = {
    filters: { "contact.experience.latest.title": ["CEO"] },
    page: 0,
    size: 1,
  };

  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "x-searchleads-api-key": API_KEY || "",
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "GrowtorLeadFinder/1.0",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  const inner = data?.results || data;
  const contacts = inner?.content || [];
  const firstContact = contacts[0] || null;

  // Build a deep key inventory so we can see every possible field path
  function getKeyPaths(obj: unknown, prefix = ""): string[] {
    if (obj == null || typeof obj !== "object") return [];
    const paths: string[] = [];
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      paths.push(fullKey);
      if (val && typeof val === "object" && !Array.isArray(val)) {
        paths.push(...getKeyPaths(val, fullKey));
      }
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
        paths.push(...getKeyPaths(val[0], `${fullKey}[0]`));
      }
    }
    return paths;
  }

  // Check specific email/phone paths
  const emailPhoneCheck = firstContact
    ? {
        "profile.email": firstContact?.profile?.email ?? "NOT_FOUND",
        "profile.work_email": firstContact?.profile?.work_email ?? "NOT_FOUND",
        "profile.personal_emails": firstContact?.profile?.personal_emails ?? "NOT_FOUND",
        "profile.emails": firstContact?.profile?.emails ?? "NOT_FOUND",
        email: firstContact?.email ?? "NOT_FOUND",
        emails: firstContact?.emails ?? "NOT_FOUND",
        contact_info: firstContact?.contact_info ?? "NOT_FOUND",
        phone_numbers: firstContact?.phone_numbers ?? "NOT_FOUND",
        "profile.phone": firstContact?.profile?.phone ?? "NOT_FOUND",
        "profile.phone_numbers": firstContact?.profile?.phone_numbers ?? "NOT_FOUND",
        phones: firstContact?.phones ?? "NOT_FOUND",
        mobile_phone: firstContact?.mobile_phone ?? "NOT_FOUND",
        direct_phone: firstContact?.direct_phone ?? "NOT_FOUND",
        // Export/credit-gating indicators
        exportable: firstContact?.exportable ?? "NOT_FOUND",
        has_email: firstContact?.has_email ?? "NOT_FOUND",
        email_available: firstContact?.email_available ?? "NOT_FOUND",
        is_email_verified: firstContact?.is_email_verified ?? "NOT_FOUND",
        email_status: firstContact?.email_status ?? "NOT_FOUND",
      }
    : null;

  return Response.json(
    {
      apiStatus: res.status,
      totalElements: inner?.totalElements ?? 0,
      contactCount: contacts.length,
      allKeyPaths: firstContact ? getKeyPaths(firstContact) : [],
      emailPhoneCheck,
      // Return the COMPLETE first contact — no truncation
      firstContact,
      // Also return the raw top-level response keys for context
      rawResponseTopKeys: Object.keys(data),
      rawInnerKeys: inner ? Object.keys(inner) : [],
    },
    { status: 200 }
  );
}
