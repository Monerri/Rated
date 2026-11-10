import { adminRole } from "@/lib/admin";
import { recordStore } from "@/lib/records";
import { jsonError } from "@/lib/request";

/** Every supplier application, newest first, for review on /admin. */
export async function GET(request: Request) {
  if (!adminRole(request)) return jsonError("Not found.", 404);
  return Response.json({ applications: await recordStore.listSupplierApplications() });
}
