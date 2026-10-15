/**
 * Checks that contact details are plausible before we pass them to anyone,
 * so specialists aren't charged for leads they can't reach. Each check
 * returns a friendly message, or null when the detail looks fine. They're
 * deliberately cautious: when in doubt (for example, a DNS lookup fails),
 * the detail is accepted. Server only.
 */

/** Common misspellings of popular email domains. */
const DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "googlemail.co": "googlemail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmail.co": "hotmail.co.uk",
  "hotmail.co.uj": "hotmail.co.uk",
  "outlok.com": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.con": "outlook.com",
  "yahooo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "yahoo.co": "yahoo.co.uk",
  "yahoo.con": "yahoo.com",
  "iclod.com": "icloud.com",
  "icloud.co": "icloud.com",
  "icloud.con": "icloud.com",
  "btinterent.com": "btinternet.com",
  "btinternet.co": "btinternet.com",
  "btinternet.con": "btinternet.com",
  "live.co": "live.co.uk",
  "sky.co": "sky.com",
};

/** Throwaway inbox services. People using these rarely want to be contacted. */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "sharklasers.com",
  "10minutemail.com",
  "temp-mail.org",
  "tempmail.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "throwawaymail.com",
  "fakeinbox.com",
  "mintemail.com",
]);

const dnsCache = new Map<string, boolean>();

/** Whether a domain can receive email: an MX record, or failing that an address record. Null if we couldn't tell. */
async function domainAcceptsMail(domain: string): Promise<boolean | null> {
  if (dnsCache.has(domain)) return dnsCache.get(domain)!;
  const lookup = async (type: "MX" | "A") => {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, {
      headers: { accept: "application/dns-json" },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) throw new Error(`DNS lookup failed: ${res.status}`);
    return (await res.json()) as { Status: number; Answer?: { type: number }[] };
  };
  try {
    const mx = await lookup("MX");
    // Status 3 means the domain doesn't exist at all.
    let ok = mx.Status === 0 && (mx.Answer ?? []).some((a) => a.type === 15);
    if (!ok && mx.Status === 0) {
      const a = await lookup("A");
      ok = a.Status === 0 && (a.Answer ?? []).some((r) => r.type === 1);
    }
    dnsCache.set(domain, ok);
    return ok;
  } catch {
    return null;
  }
}

export async function checkEmail(email: string): Promise<string | null> {
  const at = email.lastIndexOf("@");
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  const suggestion = DOMAIN_TYPOS[domain];
  if (suggestion) return `Did you mean ${local}@${suggestion}? Please check your email address.`;
  if (DISPOSABLE_DOMAINS.has(domain)) return "Please use an email address you check regularly, not a temporary one.";
  if ((await domainAcceptsMail(domain)) === false) {
    return `We couldn't find an email service at "${domain}". Please check your email address.`;
  }
  return null;
}

/**
 * Ofcom reserves these ranges for TV and radio drama; they're never real.
 * https://www.ofcom.org.uk/phones-and-broadband/phone-numbers/numbers-for-drama
 */
const DRAMA_PREFIXES = [
  "07700900",
  "01632960",
  "02079460",
  "01134960",
  "01144960",
  "01154960",
  "01164960",
  "01174960",
  "01184960",
  "01214960",
  "01314960",
  "01414960",
  "01514960",
  "01614960",
  "02920180",
  "02896496",
  "08081570",
  "09098790",
  "03069990",
];

/** Checks a UK number already normalised to start with 0 (see normalisePhone). */
export function checkPhone(phone: string): string | null {
  const notReal = "That doesn't look like a real phone number. Please check it, as specialists need to be able to call you.";
  if (DRAMA_PREFIXES.some((p) => phone.startsWith(p))) return notReal;
  // The same digit repeated, or a simple run of digits.
  if (/^0(\d)\1+$/.test(phone) || /^0?1234567890?$/.test(phone) || phone === "07123456789") return notReal;
  if (/^07/.test(phone) && phone.length !== 11) return "Mobile numbers have 11 digits. Please check yours.";
  if (/^070/.test(phone) || (/^076/.test(phone) && !/^07624/.test(phone))) {
    return "Please give a mobile or landline number. Personal and pager numbers can't be used.";
  }
  if (/^0[89]/.test(phone)) return "Please give a mobile or landline number, not a freephone or premium-rate number.";
  if (!/^0[1-357]/.test(phone)) return notReal;
  return null;
}
