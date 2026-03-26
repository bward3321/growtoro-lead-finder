import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as searchleads from "@/lib/searchleads";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { filters, desiredCount } = body;

  if (!filters || !desiredCount) {
    return Response.json({ error: "filters and desiredCount are required" }, { status: 400 });
  }

  // B2B contacts cost 2 credits each
  const creditsNeeded = desiredCount * 2;

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || user.credits < creditsNeeded) {
    return Response.json(
      { error: `Insufficient credits. Need ${creditsNeeded.toLocaleString()}, have ${(user?.credits || 0).toLocaleString()}` },
      { status: 402 }
    );
  }

  // Deduct credits upfront
  await prisma.user.update({
    where: { id: session.id },
    data: { credits: { decrement: creditsNeeded } },
  });

  let contacts: searchleads.SearchLeadsContact[];
  try {
    contacts = await searchleads.fetchContacts(filters, desiredCount);
    console.log(`[SearchLeads Export] Fetched ${contacts.length} contacts (requested ${desiredCount})`);
  } catch (error: any) {
    // Refund all credits on failure
    await prisma.user.update({
      where: { id: session.id },
      data: { credits: { increment: creditsNeeded } },
    });
    console.error("[SearchLeads Export] Error:", error.message);
    return Response.json(
      { error: error.message || "Export failed" },
      { status: error.statusCode || 502 }
    );
  }

  // If fewer contacts returned than expected, refund the difference
  const actualCredits = contacts.length * 2;
  const refund = creditsNeeded - actualCredits;
  if (refund > 0) {
    await prisma.user.update({
      where: { id: session.id },
      data: { credits: { increment: refund } },
    });
  }

  // Build a summary name from the filters
  const nameparts: string[] = [];
  if (filters.jobTitles?.length) nameparts.push(filters.jobTitles.slice(0, 2).join(", "));
  if (filters.industries?.length) nameparts.push(filters.industries[0]);
  const campaignName = `B2B - ${nameparts.join(" / ") || "Contact Search"}`;

  // Store the CSV data in the database
  const csvData = searchleads.contactsToCsv(contacts);

  try {
    const campaign = await prisma.campaign.create({
      data: {
        userId: session.id,
        name: campaignName,
        platform: "b2bcontacts",
        extractionType: "B2B_CONTACT_SEARCH",
        source: "searchleads",
        targetCount: desiredCount,
        leadsFound: contacts.length,
        creditsUsed: actualCredits,
        creditsRefunded: refund,
        config: JSON.stringify(filters),
        status: "COMPLETED",
        searchleadsData: csvData,
      },
    });

    return Response.json({
      campaign,
      leadCount: contacts.length,
      creditsUsed: actualCredits,
      creditsRefunded: refund,
    });
  } catch (dbError: any) {
    console.error("[SearchLeads Export] Database error:", dbError.message);
    return Response.json(
      { error: `Export succeeded but failed to save: ${dbError.message}` },
      { status: 500 }
    );
  }
}
