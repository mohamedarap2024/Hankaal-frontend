import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Target, Eye, Heart, Lightbulb, ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { stats as fallbackStats, team as fallbackTeam } from "@/lib/mock-data";
import { fetchStats, fetchTeam } from "@/lib/api/content";

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
  { icon: Target, title: "Mission", desc: "To make world-class education accessible to every learner, regardless of background or geography." },
  { icon: Eye, title: "Vision", desc: "A future where every motivated person has the tools, skills, and community to thrive." },
  { icon: Heart, title: "Values", desc: "Integrity, inclusivity, and an unwavering belief in our students' potential." },
  { icon: Lightbulb, title: "Approach", desc: "Hands-on, project-based learning paired with mentorship from working professionals." },
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

  const stats = statsData?.stats ?? fallbackStats;
  const team = teamData?.team ?? fallbackTeam;

  return (
    <SiteShell>
      <section className="container mx-auto px-4 pt-16 pb-12 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">About Us</div>
          <h1 className="text-4xl md:text-6xl font-display font-extrabold max-w-3xl mx-auto leading-tight">
            Built by educators, <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>for learners.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Hankaal College was founded on a simple idea: great education should be practical, patient, and progress-driven.
          </p>
        </motion.div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-3xl aspect-[4/3] overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
            <div className="h-full w-full grid place-items-center text-white/90 text-center p-12">
              <div>
                <div className="text-6xl font-display font-extrabold">Est. 2015</div>
                <div className="text-sm uppercase tracking-widest mt-3 opacity-80">A decade of learners</div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold">Our Story</h2>
            <div className="space-y-4 mt-5 text-muted-foreground leading-relaxed">
              <p>Hankaal began in a single classroom with twelve students and one belief: that consistent practice, patient teaching, and clear progress could change lives.</p>
              <p>A decade later, we serve over fifty thousand students across 120+ countries — but the philosophy hasn't budged. Every course we publish, every instructor we onboard, and every project we ship is held to that founding standard.</p>
              <p>We're not the biggest. We're the ones who care most about your outcome.</p>
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
              <div className="text-4xl md:text-5xl font-display font-extrabold">{s.value}</div>
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