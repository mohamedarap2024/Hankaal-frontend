/** Public website URL — set VITE_SITE_URL in the frontend env to your real domain. */
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") || "https://hankaal.vercel.app";

/** Official Hankaal College contact & payment defaults */
export const SITE_CONTACT = {
  name: "Hankaal College",
  email: "hankaalcollege@gmail.com",
  phone: "+252 61 4422002",
  phoneDial: "614422002",
  whatsappUrl: "https://wa.me/252614422002",
  ussdPrefix: "*712*614422002*",
  ussdSuffix: "#",
  facebookUrl: "https://www.facebook.com/share/18kuRdujZS/",
  location: "Mogadishu, Somalia",
  tagline: "Practice · Patience · Progress",
  description:
    "Hankaal College is an educational institution offering online English classes to Somali-speaking students across the globe. Based in Mogadishu.",
} as const;

export const COURSE_CATEGORIES = [
  "Languages",
  "Programming",
  "Design",
  "Business",
  "Data Science",
  "Marketing",
] as const;

export function ussdPaymentHint(amount?: number) {
  const amt = amount ?? "amount";
  return `${SITE_CONTACT.ussdPrefix}${amt}${SITE_CONTACT.ussdSuffix}`;
}
