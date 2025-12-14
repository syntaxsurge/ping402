import { Filter } from "bad-words";
import LinkifyIt from "linkify-it";

const profanityFilter = new Filter();
const linkify = new LinkifyIt();

export type PolicyOk = { ok: true; normalized: string };
export type PolicyFail = {
  ok: false;
  code:
    | "EMPTY_MESSAGE"
    | "MESSAGE_TOO_LONG"
    | "TOO_MANY_LINKS"
    | "PROFANITY_DETECTED";
  reason: string;
};

export function enforcePingPolicy(raw: string): PolicyOk | PolicyFail {
  const normalized = raw.normalize("NFKC").trim();

  if (!normalized) {
    return { ok: false, code: "EMPTY_MESSAGE", reason: "Message is empty." };
  }

  if (normalized.length > 280) {
    return {
      ok: false,
      code: "MESSAGE_TOO_LONG",
      reason: "Message must be 280 characters or less.",
    };
  }

  const links = linkify.match(normalized) ?? [];
  if (links.length > 1) {
    return {
      ok: false,
      code: "TOO_MANY_LINKS",
      reason: "Only 1 link is allowed per ping.",
    };
  }

  if (profanityFilter.isProfane(normalized)) {
    return {
      ok: false,
      code: "PROFANITY_DETECTED",
      reason: "Message contains disallowed words.",
    };
  }

  return { ok: true, normalized };
}
