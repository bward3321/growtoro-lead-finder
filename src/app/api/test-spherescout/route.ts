const HARDCODED_KEY = "639e5f6ebdeb071c3e7edc623ef869a8514d144bdd6abe77cef96dc8cdb494a7";
const BASE_URL = "https://api.spherescout.io";

async function rawFetch(url: string, key: string) {
  console.log(`[TestSphereScout] GET ${url}`);
  console.log(`[TestSphereScout] Auth header: "Token ${key.slice(0, 8)}...${key.slice(-8)}"`);

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Token ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "GrowtorLeadFinder/1.0",
    },
  });

  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  // Collect response headers
  const responseHeaders: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    responseHeaders[k] = v;
  });

  return {
    url,
    status: res.status,
    ok: res.ok,
    responseHeaders,
    body,
  };
}

export async function GET() {
  const results: Record<string, unknown> = {};

  // Check env var
  const envKey = process.env.SPHERESCOUT_API_KEY;
  results.envCheck = {
    SPHERESCOUT_API_KEY_set: !!envKey,
    SPHERESCOUT_API_KEY_length: envKey?.length ?? 0,
    SPHERESCOUT_API_KEY_preview: envKey ? `${envKey.slice(0, 8)}...${envKey.slice(-8)}` : "NOT SET",
    matchesHardcoded: envKey === HARDCODED_KEY,
  };

  try {
    // Step 1: Fetch categories with hardcoded key
    const catResult = await rawFetch(`${BASE_URL}/api/categories/`, HARDCODED_KEY);
    const catBody = catResult.body;

    results.categories = {
      ...catResult,
      bodyType: Array.isArray(catBody) ? `array[${catBody.length}]` : typeof catBody,
      // Only include first 5 to keep response manageable
      body: Array.isArray(catBody) ? catBody.slice(0, 5) : catBody,
    };

    // Step 2: Find a common category (Restaurant or Real estate agency)
    let targetCat: Record<string, unknown> | null = null;
    if (Array.isArray(catBody)) {
      targetCat =
        catBody.find((c: any) => /restaurant/i.test(c.name)) ||
        catBody.find((c: any) => /real estate/i.test(c.name)) ||
        catBody.find((c: any) => /plumber/i.test(c.name)) ||
        catBody[0] ||
        null;
    }

    if (targetCat) {
      results.targetCategory = targetCat;
      const catId = targetCat.id;

      // Step 3a: Call companies with simple query (matching test route style)
      const simpleUrl = `${BASE_URL}/api/companies/?category=${catId}&countries=US`;
      const simpleResult = await rawFetch(simpleUrl, HARDCODED_KEY);
      results.companies_simple = simpleResult;

      // Step 3b: Also test with the exact same URL format our spherescout.ts client builds
      // Our client uses encodeURIComponent and repeated params
      const clientUrl = `${BASE_URL}/api/companies/?category=${encodeURIComponent(String(catId))}&countries=${encodeURIComponent("US")}`;
      if (clientUrl !== simpleUrl) {
        const clientResult = await rawFetch(clientUrl, HARDCODED_KEY);
        results.companies_client_format = clientResult;
      } else {
        results.companies_client_format = "Same URL as simple — skipped";
      }

      // Step 3c: If env key differs from hardcoded, also test with env key
      if (envKey && envKey !== HARDCODED_KEY) {
        const envResult = await rawFetch(simpleUrl, envKey);
        results.companies_with_env_key = envResult;
      }
    } else {
      results.targetCategory = "Could not find a target category";
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    results.error = { message: msg, stack };
  }

  return Response.json(results, { status: 200 });
}
