import { contactMessageEmail, contactTopics, emailSender } from "@/lib/notifications";
import { EMAIL, jsonError, readJson, str } from "@/lib/request";

/** Contact form. Sends the message to the team inbox with reply-to set to the sender. */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("We couldn't read that request.");
  if (str(body.website_confirm, 200)) return new Response(null, { status: 201 }); // honeypot

  const name = str(body.name, 120);
  const email = str(body.email, 254);
  const topic = String(body.topic ?? "");
  const message = str(body.message, 5000);

  const fields: Record<string, string> = {};
  if (!name) fields.name = "Please enter your name.";
  if (!email || !EMAIL.test(email)) fields.email = "Please enter a valid email address.";
  if (!contactTopics.some((t) => t.value === topic)) fields.topic = "Please choose a topic.";
  if (!message) fields.message = "Please enter a message.";
  if (Object.keys(fields).length) return Response.json({ error: "Please check the highlighted fields.", fields }, { status: 400 });

  await emailSender.send(contactMessageEmail({ name: name!, email: email!, topic, message: message! }));
  return new Response(null, { status: 201 });
}
