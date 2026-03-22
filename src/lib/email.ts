import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Growtoro Lead Finder <noreply@notifications.growtoro.com>";
const BASE_URL = "https://leads.growtoro.com";

interface ScrapeDetails {
  campaignId: string;
  name: string;
  platform: string;
  extractionType: string;
  config: string;
  leadsFound: number;
}

function getSearchTarget(config: string): string {
  try {
    const parsed = JSON.parse(config);
    return parsed.keywords || parsed.hashtag || parsed.username || parsed.post_url || "-";
  } catch {
    return "-";
  }
}

const METHOD_LABELS: Record<string, string> = {
  INSTAGRAM_KEYWORD_SEARCH: "Keyword Search",
  INSTAGRAM_HASHTAG: "Hashtag",
  INSTAGRAM_USER_FOLLOWERS: "Followers",
  INSTAGRAM_USER_FOLLOWING: "Following",
  INSTAGRAM_POST_LIKERS: "Post Likers",
  INSTAGRAM_POST_COMMENTERS: "Post Commenters",
  X_KEYWORD_SEARCH: "Keyword Search",
  X_FOLLOWERS: "Followers",
  X_FOLLOWING: "Following",
  X_RETWEETS: "Retweeters",
  X_REPLIERS: "Repliers",
  YOUTUBE_KEYWORD_SEARCH: "Keyword Search",
  FACEBOOK_KEYWORD_SEARCH: "Keyword Search",
  LINKEDIN_KEYWORD_SEARCH: "Keyword Search",
  TIKTOK_KEYWORD_SEARCH: "Keyword Search",
};

function darkEmailLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td align="center" style="padding-bottom:32px;">
          <img src="${BASE_URL}/logo.png" alt="Growtoro" height="32" style="height:32px;width:auto;" />
        </td></tr>
        <tr><td style="background-color:#141420;border:1px solid #1e1e2e;border-radius:12px;padding:40px;">
          ${content}
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="color:#6b7280;font-size:13px;margin:0;">Growtoro Lead Finder</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendScrapeCompletedEmail(
  userEmail: string,
  scrape: ScrapeDetails
) {
  const method = METHOD_LABELS[scrape.extractionType] || scrape.extractionType;
  const target = getSearchTarget(scrape.config);
  const detailUrl = `${BASE_URL}/dashboard/campaigns/${scrape.campaignId}`;

  const html = darkEmailLayout(`
    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px 0;">Your scrape is complete!</h1>
    <p style="color:#9ca3af;font-size:15px;margin:0 0 28px 0;">Here are the details:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="color:#9ca3af;font-size:14px;padding:8px 0;border-bottom:1px solid #1e1e2e;">Platform</td>
        <td style="color:#ffffff;font-size:14px;padding:8px 0;border-bottom:1px solid #1e1e2e;text-align:right;text-transform:capitalize;">${scrape.platform}</td>
      </tr>
      <tr>
        <td style="color:#9ca3af;font-size:14px;padding:8px 0;border-bottom:1px solid #1e1e2e;">Method</td>
        <td style="color:#ffffff;font-size:14px;padding:8px 0;border-bottom:1px solid #1e1e2e;text-align:right;">${method}</td>
      </tr>
      <tr>
        <td style="color:#9ca3af;font-size:14px;padding:8px 0;border-bottom:1px solid #1e1e2e;">Search Term</td>
        <td style="color:#ffffff;font-size:14px;padding:8px 0;border-bottom:1px solid #1e1e2e;text-align:right;">${target}</td>
      </tr>
      <tr>
        <td style="color:#9ca3af;font-size:14px;padding:8px 0;">Emails Found</td>
        <td style="color:#22d3ee;font-size:14px;font-weight:700;padding:8px 0;text-align:right;">${scrape.leadsFound.toLocaleString()}</td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${detailUrl}" style="display:inline-block;background-color:#3b82f6;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
          Download Your Emails
        </a>
      </td></tr>
    </table>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: `Your scrape is ready — ${scrape.leadsFound.toLocaleString()} verified emails found`,
      html,
    });
  } catch (error) {
    console.error("Failed to send completion email:", error);
  }
}

export async function sendScrapeFailedEmail(
  userEmail: string,
  scrape: ScrapeDetails
) {
  const method = METHOD_LABELS[scrape.extractionType] || scrape.extractionType;
  const target = getSearchTarget(scrape.config);
  const detailUrl = `${BASE_URL}/dashboard/campaigns/${scrape.campaignId}`;

  const html = darkEmailLayout(`
    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px 0;">Your scrape has failed</h1>
    <p style="color:#9ca3af;font-size:15px;margin:0 0 28px 0;">Something went wrong with your scrape. Here are the details:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="color:#9ca3af;font-size:14px;padding:8px 0;border-bottom:1px solid #1e1e2e;">Platform</td>
        <td style="color:#ffffff;font-size:14px;padding:8px 0;border-bottom:1px solid #1e1e2e;text-align:right;text-transform:capitalize;">${scrape.platform}</td>
      </tr>
      <tr>
        <td style="color:#9ca3af;font-size:14px;padding:8px 0;border-bottom:1px solid #1e1e2e;">Method</td>
        <td style="color:#ffffff;font-size:14px;padding:8px 0;border-bottom:1px solid #1e1e2e;text-align:right;">${method}</td>
      </tr>
      <tr>
        <td style="color:#9ca3af;font-size:14px;padding:8px 0;">Search Term</td>
        <td style="color:#ffffff;font-size:14px;padding:8px 0;text-align:right;">${target}</td>
      </tr>
    </table>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px 0;">Your credits have not been charged for this scrape. You can try again or contact support if the issue persists.</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${detailUrl}" style="display:inline-block;background-color:#3b82f6;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
          View Details
        </a>
      </td></tr>
    </table>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: `Scrape failed — action needed`,
      html,
    });
  } catch (error) {
    console.error("Failed to send failure email:", error);
  }
}
