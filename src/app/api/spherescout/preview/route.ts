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

  try {
    const result = await spherescout.getCompanies({
      category: categoryId,
      countries,
      level2_locations,
    });

    // Return totalCount and preview directly from SphereScout response
    return Response.json({
      totalCount: result.totalCount ?? 0,
      preview: result.preview ?? [],
    });
  } catch (error: any) {
    console.error("[SphereScout Preview]", error.message);
    return Response.json(
      { error: `Failed to fetch preview: ${error.message}` },
      { status: 502 }
    );
  }
}
