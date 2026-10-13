import { authorised } from "@/lib/admin";
import { sendWeeklyReports } from "@/lib/reports";
import { jsonError } from "@/lib/request";

/** Sends the weekly reports. Called every Monday by the Worker's scheduled job (worker.ts). */
export async function POST(request: Request) {
  if (!authorised(request)) return jsonError("Not found.", 404);
  return Response.json(await sendWeeklyReports());
}
