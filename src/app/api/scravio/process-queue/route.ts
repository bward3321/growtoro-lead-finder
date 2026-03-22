import { getSession } from "@/lib/auth";
import { processQueue } from "@/lib/queue";

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const result = await processQueue();
  return Response.json(result);
}
