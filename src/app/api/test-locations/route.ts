// Temporary diagnostic route — tests SphereScout level2_locations and email filter formats
// DELETE THIS ROUTE after debugging

const API_KEY = process.env.SPHERESCOUT_API_KEY!;
const BASE = "https://api.spherescout.io";

const headers = {
  Authorization: `Token ${API_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent": "GrowtorLeadFinder/1.0",
};

async function testUrl(url: string): Promise<{ url: string; status: number; totalCount: number | null; error?: string }> {
  try {
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      return { url, status: res.status, totalCount: null, error: text.slice(0, 200) };
    }
    const body = await res.json();
    return { url, status: res.status, totalCount: body.totalCount ?? body.total_count ?? null };
  } catch (error: any) {
    return { url, status: 0, totalCount: null, error: error.message };
  }
}

export async function GET() {
  const results: Record<string, unknown> = {};

  // === PART 1: Level2 locations format ===

  // 1a. Baseline — no state filter
  const baseline = await testUrl(`${BASE}/api/companies/?category=8059&countries=US`);
  results.baseline = baseline;

  // Extract level2_location values from preview
  try {
    const res = await fetch(`${BASE}/api/companies/?category=8059&countries=US`, { headers, cache: "no-store" });
    const body = await res.json();
    const preview = body.preview || [];
    results.sampleLocations = preview.slice(0, 10).map((item: any) => ({
      name: item.name,
      level2_location: item.level2_location,
      city: item.city,
    }));
    // Collect unique values
    results.uniqueLocations = [...new Set(preview.map((item: any) => item.level2_location))].slice(0, 20);
  } catch (e: any) {
    results.sampleLocationsError = e.message;
  }

  // 1b. Try state abbreviation only: FL
  results.test_FL = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&level2_locations=FL`);

  // 1c. Try full code: FL11
  results.test_FL11 = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&level2_locations=FL11`);

  // 1d. Try other formats
  results.test_Florida = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&level2_locations=Florida`);
  results.test_TN = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&level2_locations=TN`);
  results.test_TN157 = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&level2_locations=TN157`);
  results.test_NY = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&level2_locations=NY`);

  // 1e. Try multiple locations
  results.test_FL_and_TN = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&level2_locations=FL&level2_locations=TN`);
  results.test_FL11_and_TN157 = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&level2_locations=FL11&level2_locations=TN157`);

  // === PART 2: Email filter formats ===

  results.email_baseline = baseline; // reuse
  results.email_has_email = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&has_email=true`);
  results.email_only_email = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&only_email=true`);
  results.email_true = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&email=true`);
  results.email_contact_details = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&contact_details=email`);
  results.email_with_email = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&with_email=true`);
  results.email_filter_email = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&filter=email`);
  results.email_has_email_1 = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&has_email=1`);

  // Also try phone variants
  results.phone_has_phone = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&has_phone=true`);
  results.phone_with_phone = await testUrl(`${BASE}/api/companies/?category=8059&countries=US&with_phone=true`);

  return Response.json(results);
}
