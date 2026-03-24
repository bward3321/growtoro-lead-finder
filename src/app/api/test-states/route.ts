const API_KEY = process.env.SPHERESCOUT_API_KEY!;
const BASE = "https://api.spherescout.io";

const headers = {
  Authorization: `Token ${API_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent": "GrowtorLeadFinder/1.0",
};

export async function GET() {
  const results: Record<string, unknown> = {};

  // Call with category=8059 (a known working category) + countries=US, no states
  const url = `${BASE}/api/companies/?category=8059&countries=US`;
  console.log(`[TestStates] GET ${url}`);

  try {
    const res = await fetch(url, { headers, cache: "no-store" });
    const body = await res.json();

    results.url = url;
    results.status = res.status;
    results.totalCount = body.totalCount ?? body.total_count;
    results.responseKeys = Object.keys(body);

    // Extract level2_location values from preview items
    const preview = body.preview || [];
    results.previewCount = preview.length;
    results.first5 = preview.slice(0, 5).map((item: any) => ({
      name: item.name,
      city: item.city,
      level2_location: item.level2_location,
      country: item.country,
    }));

    // Collect all unique level2_location values
    const uniqueStates = [...new Set(preview.map((item: any) => item.level2_location))];
    results.uniqueLevel2Locations = uniqueStates;

    // Also check what level2Locations the response provides (possible filter values)
    results.level2Locations_field = body.level2Locations || body.level2_locations || "not present";

    // Now test WITH a level2_locations filter using the format from the data
    if (uniqueStates.length > 0) {
      const testState = uniqueStates[0] as string;

      // Test format 1: as-is from data (e.g. "Georgia" or "GA")
      const url1 = `${BASE}/api/companies/?category=8059&countries=US&level2_locations=${encodeURIComponent(testState)}`;
      console.log(`[TestStates] Test with raw value: ${url1}`);
      const res1 = await fetch(url1, { headers, cache: "no-store" });
      const body1 = await res1.json();
      results.test_raw_value = {
        param: testState,
        url: url1,
        status: res1.status,
        totalCount: body1.totalCount ?? body1.total_count,
      };

      // If the value looks like a full name, also test abbreviation
      if (testState.length > 2) {
        // Try 2-letter abbreviation — won't be accurate but tests the format
        const url2 = `${BASE}/api/companies/?category=8059&countries=US&level2_locations=NY`;
        console.log(`[TestStates] Test with abbreviation: ${url2}`);
        const res2 = await fetch(url2, { headers, cache: "no-store" });
        const body2 = await res2.json();
        results.test_abbreviation = {
          param: "NY",
          url: url2,
          status: res2.status,
          totalCount: body2.totalCount ?? body2.total_count,
        };
      }

      // Also test with "Minnesota" for the user's specific case
      const url3 = `${BASE}/api/companies/?category=8059&countries=US&level2_locations=Minnesota`;
      console.log(`[TestStates] Test with full name: ${url3}`);
      const res3 = await fetch(url3, { headers, cache: "no-store" });
      const body3 = await res3.json();
      results.test_full_name = {
        param: "Minnesota",
        url: url3,
        status: res3.status,
        totalCount: body3.totalCount ?? body3.total_count,
      };

      // Test abbreviation MN
      const url4 = `${BASE}/api/companies/?category=8059&countries=US&level2_locations=MN`;
      console.log(`[TestStates] Test with MN: ${url4}`);
      const res4 = await fetch(url4, { headers, cache: "no-store" });
      const body4 = await res4.json();
      results.test_MN = {
        param: "MN",
        url: url4,
        status: res4.status,
        totalCount: body4.totalCount ?? body4.total_count,
      };
    }
  } catch (error: any) {
    results.error = error.message;
  }

  return Response.json(results);
}
