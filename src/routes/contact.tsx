import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Send, MessageCircle } from "lucide-react";
import { SITE_CONTACT } from "@/lib/site-contact";
import { WhatsAppLink } from "@/components/site/WhatsAppLink";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { sendContactMessage } from "@/lib/api/contact";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Hankaal College" },
      { name: "description", content: "Get in touch with the Hankaal College team. We're here to help." },
      { property: "og:title", content: "Contact Hankaal College" },
      { property: "og:description", content: "Reach out to our team for support, partnerships, or general questions." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    try {
      await sendContactMessage({
        firstName: form.get("fn") as string,
        lastName: form.get("ln") as string,
        email: form.get("email") as string,
        subject: form.get("subj") as string,
        message: form.get("msg") as string,
      });
      toast.success("Message sent! We'll be in touch soon.");
      e.currentTarget.reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">Contact</div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold">We'd love to hear from you</h1>
          <p className="mt-4 text-muted-foreground">Questions about our online English classes? Contact us — we reply within one business day.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 mt-12 max-w-5xl mx-auto">
          <div className="space-y-4">
            {[
              { icon: Mail, title: "Email", value: SITE_CONTACT.email, href: `mailto:${SITE_CONTACT.email}`, desc: "We reply within 24 hours" },
              { icon: Phone, title: "Phone / WhatsApp", value: SITE_CONTACT.phone, href: `tel:${SITE_CONTACT.phone.replace(/\s/g, "")}`, desc: "Call or message anytime" },
              { icon: MapPin, title: "Location", value: SITE_CONTACT.location, desc: "Online classes worldwide" },
            ].map((c) => (
              <div key={c.title} className="p-5 rounded-2xl bg-card border border-border flex gap-4">
                <div className="h-11 w-11 rounded-xl grid place-items-center text-primary-foreground shrink-0" style={{ background: "var(--gradient-hero)" }}>
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">{c.title}</div>
                  {c.href ? (
                    <a href={c.href} className="text-sm font-medium text-foreground/90 hover:text-primary">{c.value}</a>
                  ) : (
                    <div className="text-sm font-medium text-foreground/90">{c.value}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-0.5">{c.desc}</div>
                </div>
              </div>
            ))}
            <div className="p-5 rounded-2xl bg-card border border-border flex flex-col gap-3">
              <div className="flex items-center gap-2 font-semibold"><MessageCircle className="h-5 w-5 text-primary" /> Quick contact</div>
              <WhatsAppLink href={SITE_CONTACT.whatsappUrl} label="Chat on WhatsApp" variant="button" className="w-full" />
              <a
                href={SITE_CONTACT.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary hover:underline text-center"
              >
                Visit us on Facebook
              </a>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-card border border-border space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="fn">First name</Label><Input id="fn" name="fn" required /></div>
              <div className="space-y-2"><Label htmlFor="ln">Last name</Label><Input id="ln" name="ln" required /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
            <div className="space-y-2"><Label htmlFor="subj">Subject</Label><Input id="subj" name="subj" required /></div>
            <div className="space-y-2"><Label htmlFor="msg">Message</Label><Textarea id="msg" name="msg" rows={5} required /></div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send message"} <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}
