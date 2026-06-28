import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Target, Eye, Heart, Lightbulb, ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { stats as fallbackStats, team as fallbackTeam } from "@/lib/mock-data";
import { fetchStats, fetchTeam, fetchSiteSettings } from "@/lib/api/content";
import { VideoPlayer } from "@/components/courses/VideoPlayer";
import { CountUp } from "@/components/site/CountUp";
import { SITE_CONTACT } from "@/lib/site-contact";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Hankaal College" },
      { name: "description", content: "Our story, mission, and the team behind Hankaal College." },
      { property: "og:title", content: "About Hankaal College" },
      { property: "og:description", content: "Practice. Patience. Progress. Learn the story behind Hankaal College." },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: Target, title: "Mission", desc: "To deliver practical online English education to Somali-speaking students everywhere, with patience and real progress." },
  { icon: Eye, title: "Vision", desc: "A world where every motivated learner can speak, write, and succeed in English — from Mogadishu to the global diaspora." },
  { icon: Heart, title: "Values", desc: "Practice, patience, and progress — the foundation of everything we teach at Hankaal College." },
  { icon: Lightbulb, title: "Approach", desc: "Live-feel online classes, structured courses, and support via phone, WhatsApp, and email." },
];

function AboutPage() {
  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    placeholderData: { stats: fallbackStats },
  });
  const { data: teamData } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeam,
    placeholderData: { team: fallbackTeam },
  });
  const { data: settingsData } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
  });

  const stats = statsData?.stats ?? fallbackStats;
  const team = teamData?.team ?? fallbackTeam;
  const aboutVideoUrl = settingsData?.settings?.about_video_url?.trim();

  return (
    <SiteShell>
      <section className="container mx-auto px-4 pt-16 pb-12 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">About Us</div>
          <h1 className="text-4xl md:text-6xl font-display font-extrabold max-w-3xl mx-auto leading-tight">
            Built by educators, <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>for learners.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            {SITE_CONTACT.description}
          </p>
        </motion.div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-3xl aspect-[4/3] overflow-hidden bg-black" style={aboutVideoUrl ? undefined : { background: "var(--gradient-hero)" }}>
            {aboutVideoUrl ? (
              <VideoPlayer url={aboutVideoUrl} title="About Hankaal College" className="aspect-[4/3]" autoPlay loop />
            ) : (
              <div className="h-full w-full grid place-items-center text-white/90 text-center p-12">
                <div>
                  <div className="text-6xl font-display font-extrabold">Est. 2015</div>
                  <div className="text-sm uppercase tracking-widest mt-3 opacity-80">A decade of learners</div>
                </div>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold">Our Story</h2>
            <div className="space-y-4 mt-5 text-muted-foreground leading-relaxed">
              <p>Hankaal College offers online English classes to Somali-speaking students across the globe. We are based in Mogadishu and serve learners who want to speak, write, and use English with confidence.</p>
              <p>Our courses are sold online — free and paid English programs you can access from anywhere. Whether you are preparing for work, study, or daily conversation, we meet you where you are.</p>
              <p>Practice · Patience · Progress — that is our promise to every student.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="p-6 rounded-2xl bg-card border border-border">
              <div className="h-12 w-12 rounded-xl grid place-items-center text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
                <v.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-lg mt-4">{v.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="rounded-3xl p-10 md:p-14 grid grid-cols-2 md:grid-cols-4 gap-6" style={{ background: "var(--gradient-hero)" }}>
          {stats.map((s) => (
            <div key={s.label} className="text-center text-primary-foreground">
              <CountUp value={s.value} className="text-4xl md:text-5xl font-display font-extrabold" />
              <div className="text-sm opacity-85 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">Our Team</div>
          <h2 className="text-3xl md:text-4xl font-display font-bold">Meet the people behind Hankaal</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-12">
          {team.map((m, i) => (
            <motion.div key={m.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="group rounded-2xl overflow-hidden bg-card border border-border">
              <div className="aspect-square overflow-hidden">
                <img src={m.avatar} alt={m.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-5 text-center">
                <div className="font-display font-bold">{m.name}</div>
                <div className="text-sm text-muted-foreground">{m.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="rounded-3xl p-10 md:p-14 text-center bg-card border border-border">
          <h2 className="text-3xl md:text-4xl font-display font-bold">Ready to start your journey?</h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">Join thousands of learners turning practice and patience into measurable progress.</p>
          <Button variant="hero" size="xl" className="mt-7" asChild>
            <Link to="/courses">Explore Courses <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}