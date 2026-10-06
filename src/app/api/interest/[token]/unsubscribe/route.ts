import { recordStore } from "@/lib/records";

type Context = { params: Promise<{ token: string }> };

/**
 * Unsubscribes from a register-interest request. POST rather than GET so
 * that link scanners and prefetching can't unsubscribe someone by accident.
 * Always succeeds, so it reveals nothing about whether a token exists.
 */
export async function POST(_request: Request, { params }: Context) {
  const { token } = await params;
  const record = await recordStore.getInterestRegistration(token);
  if (record && !record.unsubscribedAt) {
    await recordStore.updateInterestRegistration(token, { unsubscribedAt: new Date().toISOString() });
  }
  return new Response(null, { status: 204 });
}
