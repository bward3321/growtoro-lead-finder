import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = request.nextUrl.searchParams.get("url");
  const filename = request.nextUrl.searchParams.get("filename") || "growtoro_leads.csv";

  if (!url) {
    return Response.json({ error: "url is required" }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return Response.json(
        { error: `Failed to fetch CSV: ${res.status}` },
        { status: 502 }
      );
    }

    const csvData = await res.arrayBuffer();

    return new Response(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(csvData.byteLength),
      },
    });
  } catch (error: any) {
    console.error("[Download Proxy]", error.message);
    return Response.json(
      { error: "Failed to download file" },
      { status: 502 }
    );
  }
}
