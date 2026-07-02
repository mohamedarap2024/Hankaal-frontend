import { Link } from "@tanstack/react-router";
import { Facebook, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { useSiteContact } from "@/lib/use-site-contact";
import { WhatsAppLink } from "./WhatsAppLink";

export function Footer() {
  const contact = useSiteContact();
  return (
    <footer className="bg-secondary/50 border-t border-border mt-20">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo size={56} />
            <p className="text-sm text-muted-foreground max-w-xs">
              {contact.description}
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={contact.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 grid place-items-center rounded-full bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <WhatsAppLink href={contact.whatsappUrl} label="" className="!h-9 !w-9 !p-0 !rounded-full" />
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Explore</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/courses" className="hover:text-primary">English Courses</Link></li>
              <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
              <li><Link to="/register" className="hover:text-primary">Become a Student</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Support</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/contact" className="hover:text-primary">Help & Contact</Link></li>
              <li><a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Facebook Page</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Contact</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" /> {contact.location}</li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <a href={`mailto:${contact.email}`} className="hover:text-primary">{contact.email}</a>
              </li>
              {contact.phones.map((phone) => (
                <li key={phone} className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-primary">{phone}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {contact.name}. All rights reserved.</p>
          <p className="italic">{contact.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
