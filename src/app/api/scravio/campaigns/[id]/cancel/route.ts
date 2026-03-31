import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { cancelQueuedCampaign } from "@/lib/queue";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const updated = await cancelQueuedCampaign(id, session.id);

  if (!updated) {
    return Response.json({ error: "Campaign not found or not in QUEUED state" }, { status: 400 });
  }

  return Response.json({ campaign: updated, creditsRefunded: updated.creditsRefunded });
}
