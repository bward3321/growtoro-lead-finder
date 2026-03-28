export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";

const API_KEY = process.env.SEARCHLEADS_API_KEY || "";

function findFieldPaths(obj: unknown, prefix = ""): string[] {
  if (obj == null || typeof obj !== "object") return [];
  const paths: string[] = [];
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    paths.push(fullKey);
    if (val && typeof val === "object" && !Array.isArray(val)) {
      paths.push(...findFieldPaths(val, fullKey));
    }
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
      paths.push(...findFieldPaths(val[0], `${fullKey}[0]`));
    }
  }
  return paths;
}

function searchForFields(obj: unknown, targets: string[], prefix = ""): Record<string, unknown> {
  const found: Record<string, unknown> = {};
  if (obj == null || typeof obj !== "object") return found;
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (targets.some((t) => key.toLowerCase().includes(t))) {
      found[fullKey] = val;
    }
    if (val && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(found, searchForFields(val, targets, fullKey));
    }
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
      Object.assign(found, searchForFields(val[0], targets, `${fullKey}[0]`));
    }
  }
  return found;
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = "https://pro.searchleads.co/functions/v1/people-search/export";
  const body = {
    filters: { "contact.experience.latest.title": ["CEO"] },
    page: 0,
    size: 2,
  };

  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "x-searchleads-api-key": API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "GrowtorLeadFinder/1.0",
    },
    body: JSON.stringify(body),
  });

  const responseHeaders: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  const text = await res.text();
  let jsonBody: unknown = null;
  try {
    jsonBody = JSON.parse(text);
  } catch {
    jsonBody = text;
  }

  // Find the first contact/result item
  const data = jsonBody as Record<string, unknown> | null;
  const inner = (data?.results || data) as Record<string, unknown> | null;
  const content = (inner?.content || data?.content || data?.data) as unknown[] | null;
  const firstItem = Array.isArray(content) && content.length > 0 ? content[0] : null;

  // If response is an array directly
  const firstFromArray = Array.isArray(jsonBody) && jsonBody.length > 0 ? jsonBody[0] : null;
  const item = firstItem || firstFromArray;

  const emailPhoneTargets = [
    "email", "personal_email", "work_email", "emails",
    "phone", "mobile", "valid_mobile_number", "phone_numbers",
  ];

  return Response.json({
    status: res.status,
    responseHeaders,
    completeBody: jsonBody,
    topLevelKeys: data ? Object.keys(data) : typeof jsonBody,
    innerKeys: inner && typeof inner === "object" ? Object.keys(inner) : null,
    firstItemKeys: item && typeof item === "object" ? Object.keys(item as Record<string, unknown>) : null,
    firstItemAllPaths: item ? findFieldPaths(item) : null,
    emailPhoneFieldsFound: item ? searchForFields(item, emailPhoneTargets) : null,
    firstItem,
  }, { status: 200 });
}
