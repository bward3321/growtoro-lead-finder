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

  return Response.json({
    totalElements: inner?.totalElements ?? 0,
    contactCount: contacts.length,
    firstContactTopKeys: firstContact ? Object.keys(firstContact) : [],
    profileKeys: firstContact?.profile ? Object.keys(firstContact.profile) : [],
    companyKeys: firstContact?.company ? Object.keys(firstContact.company) : [],
    firstContact,
  }, { status: 200 });
}
