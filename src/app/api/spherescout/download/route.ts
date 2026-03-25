import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as spherescout from "@/lib/spherescout";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const searchId = request.nextUrl.searchParams.get("searchId");
  if (!searchId) {
    return Response.json({ error: "searchId is required" }, { status: 400 });
  }

  // Verify the user owns this campaign
  const campaign = await prisma.campaign.findFirst({
    where: { spherescoutSearchId: searchId, userId: session.id },
  });
  if (!campaign) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await spherescout.getDownloadUrl(searchId);
    console.log("[SphereScout Download] Full response:", JSON.stringify(result));

    // Extract URL — check all possible field locations
    const downloadUrl =
      (typeof result === "string" ? result : null) ||
      result?.url ||
      result?.download_url ||
      result?.downloadUrl ||
      result?.data?.url ||
      result?.data?.download_url;

    if (!downloadUrl || typeof downloadUrl !== "string") {
      console.error("[SphereScout Download] No URL found in response. Keys:", Object.keys(result || {}));
      return Response.json(
        { error: "Download not ready yet — SphereScout is still processing. Try again in a moment." },
        { status: 202 }
      );
    }

    return Response.json({ downloadUrl });
  } catch (error: any) {
    console.error("[SphereScout Download] Error:", error.message);
    if (error.spherescoutResponse) {
      console.error("[SphereScout Download] API response:", JSON.stringify(error.spherescoutResponse));
    }
    return Response.json(
      { error: error.message || "Failed to get download URL" },
      { status: 502 }
    );
  }
}
