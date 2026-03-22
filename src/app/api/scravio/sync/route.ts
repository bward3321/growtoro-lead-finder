import { getSession } from "@/lib/auth";
import { syncAllActiveCampaigns, processQueue } from "@/lib/queue";

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const syncResult = await syncAllActiveCampaigns();
  const queueResult = await processQueue();

  return Response.json({ sync: syncResult, queue: queueResult });
}
