import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight, Award, BookOpen, Clock, GraduationCap, Headphones, Infinity as InfinityIcon,
  Play, Sparkles, Star, Users,
} from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { CourseCard } from "@/components/site/CourseCard";
import { CountUp } from "@/components/site/CountUp";
import { useQuery } from "@tanstack/react-query";
import { courses as fallbackCourses, faqs as fallbackFaqs, stats as fallbackStats, testimonials as fallbackTestimonials } from "@/lib/mock-data";
import { fetchCourses } from "@/lib/api/courses";
import { fetchFaqs, fetchStats, fetchSiteSettings, fetchTestimonials } from "@/lib/api/content";
import { subscribeNewsletter } from "@/lib/api/contact";
import { HERO_IMAGE } from "@/lib/images";
import { SITE_CONTACT, ussdPaymentHint } from "@/lib/site-contact";
import { ApiError } from "@/lib/api/client";
import { WhatsAppIcon } from "@/components/site/WhatsAppLink";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hankaal College — Learn English Online" },
      { name: "description", content: "Online English classes for Somali-speaking students worldwide. Based in Mogadishu. Practice · Patience · Progress." },
      { property: "og:title", content: "Hankaal College — Online English Classes" },
      { property: "og:description", content: SITE_CONTACT.description },
    ],
  }),
  component: HomePage,
});

const features = [
  { icon: GraduationCap, title: "Expert English Teachers", desc: "Learn from qualified instructors who understand Somali speakers and global English standards." },
  { icon: BookOpen, title: "English Language Courses", desc: "Speaking, grammar, business English, IELTS prep, and more — sold as online courses you can study anywhere." },
  { icon: Award, title: "Certificates", desc: "Complete courses and earn certificates that show your English progress to employers and schools." },
  { icon: Clock, title: "Flexible Online Classes", desc: "Study at your own pace, on any device — ideal for students in Somalia and across the diaspora." },
  { icon: InfinityIcon, title: "Lifetime Access", desc: "Enroll once and revisit lessons anytime, with updates included." },
  { icon: Headphones, title: "Student Support", desc: "Reach us on WhatsApp, phone, or email — we're here to help you succeed." },
];

function HomePage() {
  const { data: coursesData } = useQuery({
    queryKey: ["courses", "home"],
    queryFn: () => fetchCourses(),
    placeholderData: { courses: fallbackCourses, total: fallbackCourses.length },
  });
  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    placeholderData: { stats: fallbackStats },
  });
  const { data: testimonialsData } = useQuery({
    queryKey: ["testimonials"],
    queryFn: fetchTestimonials,
    placeholderData: { testimonials: fallbackTestimonials },
  });
  const { data: faqsData } = useQuery({
    queryKey: ["faqs"],
    queryFn: fetchFaqs,
    placeholderData: { faqs: fallbackFaqs },
  });
  const { data: settingsData } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
    staleTime: 60_000,
  });

  const popular = (coursesData?.courses ?? fallbackCourses).slice(0, 6);
  const stats = statsData?.stats ?? fallbackStats;
  const testimonials = testimonialsData?.testimonials ?? fallbackTestimonials;
  const faqs = faqsData?.faqs ?? fallbackFaqs;
  const heroImage = settingsData?.settings?.hero_image_url?.trim() || HERO_IMAGE;
  const whatsappUrl = settingsData?.settings?.whatsapp_url?.trim() || SITE_CONTACT.whatsappUrl;

  const handleNewsletter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    try {
      await subscribeNewsletter(email);
      toast.success("Subscribed! Check your inbox.");
      e.currentTarget.reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Subscription failed");
    }
  };

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, color-mix(in oklab, var(--primary) 25%, transparent), transparent 50%), radial-gradient(circle at 80% 80%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 50%)" }} />
        <div className="container mx-auto px-4 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="secondary" className="mb-5 gap-1.5 px-3 py-1.5">
              <Sparkles className="h-3 w-3 text-accent" /> Online English classes · Mogadishu & worldwide
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold leading-[1.05] tracking-tight">
              Learn <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>English</span> with Hankaal College
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              {SITE_CONTACT.description} Browse our English courses, enroll free or pay online, and start learning today.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="hero" size="xl" asChild>
                <Link to="/courses">Browse Courses <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/about"><Play className="h-4 w-4" /> Watch Story</Link>
              </Button>
              <Button variant="accent" size="xl" asChild>
                <Link to="/instructor"><GraduationCap className="h-4 w-4" /> Be Instructor</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl bg-card border border-border px-4 py-3">
                  <CountUp value={s.value} className="text-2xl font-display font-bold text-primary" />
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
            <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-30" style={{ background: "var(--gradient-hero)" }} />
            <div className="relative rounded-2xl overflow-hidden shadow-[var(--shadow-elegant)]">
              <img src={heroImage} alt="Students learning English at Hankaal College" width={1280} height={960} className="w-full object-cover" />
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with us on WhatsApp"
                className="absolute top-4 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-white/90 transition-transform hover:scale-110"
              >
                <WhatsAppIcon className="h-7 w-7" />
              </a>
            </div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
              <div className="h-10 w-10 rounded-full grid place-items-center" style={{ background: "var(--gradient-accent)" }}>
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">Certificate Earned</div>
                <div className="text-xs text-muted-foreground">Web Development</div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="absolute -top-4 -right-4 bg-card border border-border rounded-xl px-4 py-3 shadow-lg flex items-center gap-2">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="text-sm font-semibold">4.9 / 5.0</span>
              <span className="text-xs text-muted-foreground">12k+ reviews</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <SectionHeader eyebrow="Why Hankaal" title="Built for learners who mean business" desc="Everything you need to learn faster, smarter, and with real outcomes." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-12">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-[var(--shadow-card)] transition-all">
              <div className="h-12 w-12 rounded-xl grid place-items-center mb-4 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-lg mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Popular Courses */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-sm font-semibold text-accent uppercase tracking-widest mb-2">Popular Right Now</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold">Top-rated courses</h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/courses">View all <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
        </div>
      </section>

      {/* Why Choose Us split */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-3xl p-8 md:p-14 grid lg:grid-cols-2 gap-10 items-center" style={{ background: "var(--gradient-hero)" }}>
          <div className="text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight">Learning that fits the way you live.</h2>
            <p className="mt-4 text-primary-foreground/85 max-w-lg">From your phone on the bus to your laptop at 2am — Hankaal goes wherever you go, and stays at your pace.</p>
            <ul className="mt-6 space-y-3">
              {["Hands-on real-world projects", "Mentorship from working professionals", "Active global student community", "Career support & job placement help"].map((x) => (
                <li key={x} className="flex items-start gap-3 text-primary-foreground/95">
                  <span className="mt-1 h-2 w-2 rounded-full bg-accent" /> {x}
                </li>
              ))}
            </ul>
            <Button variant="accent" size="lg" className="mt-8" asChild>
              <Link to="/register">Join Hankaal Today</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { v: "98%", l: "Completion rate" }, { v: "15k+", l: "Jobs landed" },
              { v: "120+", l: "Countries reached" }, { v: "4.9★", l: "Average rating" },
            ].map((s) => (
              <div key={s.l} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-primary-foreground">
                <CountUp value={s.v} className="text-3xl font-display font-bold" />
                <div className="text-sm opacity-80 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <SectionHeader eyebrow="Student Stories" title="Real journeys, real outcomes" desc="Hear from learners who've turned ambition into achievement." />
        <div className="grid gap-6 md:grid-cols-3 mt-12">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex gap-0.5 text-accent mb-4">
                {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="text-foreground leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
                <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <SectionHeader eyebrow="FAQ" title="Questions, answered" desc="" />
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-left font-display text-base hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container mx-auto px-4 pb-20">
        <div className="rounded-3xl bg-card border border-border p-8 md:p-14 text-center max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute inset-0 -z-10 opacity-50" style={{ backgroundImage: "radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 60%)" }} />
          <Users className="h-10 w-10 mx-auto text-accent" />
          <h2 className="text-3xl md:text-4xl font-display font-bold mt-4">Stay in the loop</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Weekly course drops, scholarships, and learning tips — straight to your inbox.</p>
          <form className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleNewsletter}>
            <Input name="email" type="email" placeholder="you@email.com" required className="h-12" />
            <Button variant="hero" size="lg" type="submit">Subscribe</Button>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">{eyebrow}</div>
      <h2 className="text-3xl md:text-4xl font-display font-bold">{title}</h2>
      {desc && <p className="mt-4 text-muted-foreground">{desc}</p>}
    </div>
  );
}
