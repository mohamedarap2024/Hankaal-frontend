import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchSiteSettings } from "@/lib/api/content";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** Square size in px — logo is circular */
  size?: number;
  /** Show college name beside the logo (best for header) */
  withText?: boolean;
  className?: string;
};

export function Logo({ size = 48, withText = false, className }: LogoProps) {
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
    staleTime: 60_000,
  });

  const logoUrl = data?.settings?.logo_url ?? "/hankaal-logo.png";
  const siteName = data?.settings?.site_name ?? "Hankaal College";
  const tagline = data?.settings?.site_tagline?.trim() || "Practice · Patience · Progress";

  return (
    <Link
      to="/"
      className={cn(
        "inline-flex items-center shrink-0 group",
        withText ? "gap-2.5 sm:gap-3" : "",
        className,
      )}
    >
      <img
        src={logoUrl}
        alt={siteName}
        width={size}
        height={size}
        className="rounded-full object-cover transition-transform group-hover:scale-[1.03] shadow-sm ring-2 ring-primary/10"
        style={{ width: size, height: size }}
      />
      {withText && (
        <div className="flex flex-col justify-center leading-none">
          <span
            className="font-display font-extrabold text-[15px] sm:text-[17px] tracking-tight text-foreground group-hover:text-primary transition-colors"
          >
            Hankaal College
          </span>
          <span className="hidden sm:block text-[12px] uppercase tracking-[0.16em] text-muted-foreground mt-1">
            {tagline}
          </span>
        </div>
      )}
    </Link>
  );
}
