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
    const result = await spherescout.getDownloadStatus(searchId);
    return Response.json(result);
  } catch (error: any) {
    console.error("[SphereScout Status]", error.message);
    return Response.json(
      { error: "Failed to check status" },
      { status: 502 }
    );
  }
}
