export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";

const API_KEY = process.env.SEARCHLEADS_API_KEY || "";
const HEADERS = {
  "x-searchleads-api-key": API_KEY,
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent": "GrowtorLeadFinder/1.0",
};

const CEO_FILTER = { "contact.experience.latest.title": ["CEO"] };

interface TestCase {
  name: string;
  url: string;
  body: Record<string, unknown>;
}

const tests: TestCase[] = [
  {
    name: "Test 1: people-export",
    url: "https://pro.searchleads.co/functions/v1/people-export",
    body: { filters: CEO_FILTER, page: 0, size: 5 },
  },
  {
    name: "Test 2: export",
    url: "https://pro.searchleads.co/functions/v1/export",
    body: { filters: CEO_FILTER, page: 0, size: 5 },
  },
  {
    name: "Test 3: people-search with mode=export",
    url: "https://pro.searchleads.co/functions/v1/people-search",
    body: { filters: CEO_FILTER, page: 0, size: 5, mode: "export" },
  },
  {
    name: "Test 4: people-search with includeContactInfo=true",
    url: "https://pro.searchleads.co/functions/v1/people-search",
    body: { filters: CEO_FILTER, page: 0, size: 5, includeContactInfo: true },
  },
  {
    name: "Test 5: people-search with fields array",
    url: "https://pro.searchleads.co/functions/v1/people-search",
    body: {
      filters: CEO_FILTER,
      page: 0,
      size: 5,
      fields: ["email", "personal_email", "valid_mobile_number", "name", "title"],
    },
  },
  {
    name: "Test 6: contacts/export",
    url: "https://pro.searchleads.co/functions/v1/contacts/export",
    body: { filters: CEO_FILTER, size: 5 },
  },
  {
    name: "Test 7: search-and-export",
    url: "https://pro.searchleads.co/functions/v1/search-and-export",
    body: { filters: CEO_FILTER, size: 5 },
  },
  {
    name: "Test 8: people-search/export",
    url: "https://pro.searchleads.co/functions/v1/people-search/export",
    body: { filters: CEO_FILTER, size: 5 },
  },
];

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const results = await Promise.all(
    tests.map(async (t) => {
      try {
        const res = await fetch(t.url, {
          method: "POST",
          cache: "no-store",
          headers: HEADERS,
          body: JSON.stringify(t.body),
        });
        const text = await res.text();
        return {
          name: t.name,
          endpoint: t.url,
          status: res.status,
          bodyPreview: text.substring(0, 500),
        };
      } catch (err: unknown) {
        return {
          name: t.name,
          endpoint: t.url,
          status: "FETCH_ERROR",
          bodyPreview: err instanceof Error ? err.message : String(err),
        };
      }
    })
  );

  return Response.json({ results }, { status: 200 });
}
