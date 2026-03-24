import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import * as spherescout from "@/lib/spherescout";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const countries = searchParams.get("countries");
  const level2_locations = searchParams.get("level2_locations") || undefined;

  if (!category || !countries) {
    return Response.json(
      { error: "category and countries are required" },
      { status: 400 }
    );
  }

  const categoryId = parseInt(category, 10);
  if (isNaN(categoryId)) {
    return Response.json(
      { error: "category must be a valid integer ID" },
      { status: 400 }
    );
  }

  // Log env var status for debugging
  const envKey = process.env.SPHERESCOUT_API_KEY;
  console.log("[SphereScout Preview] ENV KEY set:", !!envKey, "length:", envKey?.length);
  console.log("[SphereScout Preview] Params:", {
    category: categoryId,
    categoryType: typeof categoryId,
    countries,
    level2_locations,
  });

  try {
    const result = await spherescout.getCompanies({
      category: categoryId,
      countries,
      level2_locations,
    });

    console.log("[SphereScout Preview] Result keys:", Object.keys(result || {}));
    console.log("[SphereScout Preview] totalCount:", result?.totalCount);
    console.log("[SphereScout Preview] preview length:", result?.preview?.length);

    // Return full result for debugging
    return Response.json(result);
  } catch (error: any) {
    console.error("[SphereScout Preview] Error:", error.message);
    console.error("[SphereScout Preview] Status:", error.statusCode);
    console.error("[SphereScout Preview] Full response:", JSON.stringify(error.spherescoutResponse));
    return Response.json(
      {
        error: `Failed to fetch preview: ${error.message}`,
        statusCode: error.statusCode,
        spherescoutResponse: error.spherescoutResponse,
        debug: {
          envKeySet: !!envKey,
          envKeyLength: envKey?.length,
          categoryId,
          countries,
          level2_locations,
        },
      },
      { status: 502 }
    );
  }
}
