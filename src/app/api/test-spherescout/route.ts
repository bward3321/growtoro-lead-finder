const API_KEY = "639e5f6ebdeb071c3e7edc623ef869a8514d144bdd6abe77cef96dc8cdb494a7";
const BASE_URL = "https://api.spherescout.io";

const headers = {
  Authorization: `Token ${API_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent": "GrowtorLeadFinder/1.0",
};

export async function GET() {
  const results: Record<string, unknown> = {};

  // Step 1: Fetch categories
  try {
    const catUrl = `${BASE_URL}/api/categories/`;
    console.log(`[TestSphereScout] GET ${catUrl}`);
    const catRes = await fetch(catUrl, { headers, cache: "no-store" });
    const catText = await catRes.text();
    let catData: unknown;
    try {
      catData = JSON.parse(catText);
    } catch {
      catData = catText;
    }

    results.categories = {
      status: catRes.status,
      ok: catRes.ok,
      dataType: Array.isArray(catData) ? `array[${(catData as unknown[]).length}]` : typeof catData,
      first5: Array.isArray(catData) ? (catData as unknown[]).slice(0, 5) : catData,
    };

    // Step 2: Use first category ID to fetch companies
    const firstCat = Array.isArray(catData) && catData.length > 0 ? catData[0] : null;
    if (firstCat && typeof firstCat === "object" && firstCat !== null) {
      const catObj = firstCat as Record<string, unknown>;
      const categoryId = catObj.id;

      const compUrl = `${BASE_URL}/api/companies/?category=${categoryId}&countries=US`;
      console.log(`[TestSphereScout] GET ${compUrl}`);
      const compRes = await fetch(compUrl, { headers, cache: "no-store" });
      const compText = await compRes.text();
      let compData: unknown;
      try {
        compData = JSON.parse(compText);
      } catch {
        compData = compText;
      }

      results.companies = {
        url: compUrl,
        categoryUsed: catObj,
        status: compRes.status,
        ok: compRes.ok,
        responseKeys:
          compData && typeof compData === "object" && !Array.isArray(compData)
            ? Object.keys(compData as Record<string, unknown>)
            : null,
        fullResponse: compData,
      };
    } else {
      results.companies = { error: "No categories returned to test with", firstCat };
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    results.error = msg;
  }

  return Response.json(results, { status: 200 });
}
