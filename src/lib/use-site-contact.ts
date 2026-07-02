import { useQuery } from "@tanstack/react-query";
import { fetchSiteSettings } from "@/lib/api/content";
import { SITE_CONTACT } from "@/lib/site-contact";

export type UssdMethod = { label: string; code: string };

/**
 * Resolves live, admin-editable contact & payment info from the Site CMS
 * settings, falling back to the built-in defaults. Contact info entered in the
 * admin dashboard is reflected everywhere this hook is used.
 */
export function useSiteContact() {
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
    staleTime: 60_000,
  });
  const s = data?.settings ?? {};

  // Allow multiple phone numbers: separate with commas, new lines, or 2+ spaces.
  const phones = (s.contact_phone?.trim() || SITE_CONTACT.phone)
    .split(/[,\n]+|\s{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const suffix = s.payment_ussd_suffix ?? SITE_CONTACT.ussdSuffix;
  const methodDefs: { label: string; prefix: string }[] = [
    { label: "EVC Plus", prefix: s.ussd_evc?.trim() || s.payment_ussd_prefix?.trim() || SITE_CONTACT.ussdPrefix },
    { label: "eDahab", prefix: s.ussd_edahab?.trim() || "" },
    { label: "Jeeb", prefix: s.ussd_jeeb?.trim() || "" },
  ].filter((m) => m.prefix);

  return {
    name: s.site_name?.trim() || SITE_CONTACT.name,
    email: s.contact_email?.trim() || SITE_CONTACT.email,
    phones,
    whatsappUrl: s.whatsapp_url?.trim() || SITE_CONTACT.whatsappUrl,
    facebookUrl: s.facebook_url?.trim() || SITE_CONTACT.facebookUrl,
    tagline: s.site_tagline?.trim() || SITE_CONTACT.tagline,
    location: SITE_CONTACT.location,
    description: SITE_CONTACT.description,
    ussdSuffix: suffix,
    /** Build the dial codes for a given amount across all configured methods. */
    ussdMethods(amount: number | string): UssdMethod[] {
      return methodDefs.map((m) => ({ label: m.label, code: `${m.prefix}${amount}${suffix}` }));
    },
  };
}
