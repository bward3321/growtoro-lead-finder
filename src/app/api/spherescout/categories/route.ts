import { getSession } from "@/lib/auth";
import * as spherescout from "@/lib/spherescout";

let cachedCategories: spherescout.SphereScoutCategory[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (cachedCategories && Date.now() - cacheTime < CACHE_TTL) {
    return Response.json({ categories: cachedCategories });
  }

  try {
    const categories = await spherescout.getCategories();
    cachedCategories = categories;
    cacheTime = Date.now();
    return Response.json({ categories });
  } catch (error: any) {
    console.error("[SphereScout Categories]", error.message);
    return Response.json(
      { error: "Failed to fetch categories" },
      { status: 502 }
    );
  }
}
