import { getSession } from "@/lib/auth";
import { syncAllActiveCampaigns, processQueue } from "@/lib/queue";

async function handleSync() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const syncResult = await syncAllActiveCampaigns();
  const queueResult = await processQueue();

  return Response.json({ sync: syncResult, queue: queueResult });
}

export async function GET() {
  return handleSync();
}

export async function POST() {
  return handleSync();
}
