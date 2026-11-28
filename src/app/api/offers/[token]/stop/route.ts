import { stopOffers } from "@/lib/referralInvites";
import { jsonError } from "@/lib/request";

/** The "stop offers like this" link in offer emails to specialists. */
export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (await stopOffers(token)) ? Response.json({ stopped: true }) : jsonError("That link isn't valid.", 404);
}
