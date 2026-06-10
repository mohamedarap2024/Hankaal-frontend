import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseCard } from "@/components/site/CourseCard";
import { fetchCourses } from "@/lib/api/courses";
import { courses as fallbackCourses } from "@/lib/mock-data";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses — Hankaal College" },
      { name: "description", content: "Browse 350+ online courses in tech, design, business, and more." },
      { property: "og:title", content: "All Courses — Hankaal College" },
      { property: "og:description", content: "Find the perfect course to advance your career." },
    ],
  }),
  component: CoursesPage,
});

const categories = ["All", "Programming", "Design", "Business", "Data Science", "Marketing", "Languages"];

function CoursesPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("popular");

  const { data, isLoading } = useQuery({
    queryKey: ["courses", cat, query, sort],
    queryFn: () =>
      fetchCourses({
        category: cat !== "All" ? cat : undefined,
        search: query || undefined,
        sort: sort !== "popular" ? sort : undefined,
      }),
    placeholderData: { courses: fallbackCourses, total: fallbackCourses.length },
  });

  const filtered = useMemo(() => data?.courses ?? [], [data]);

  return (
    <SiteShell>
      <section className="container mx-auto px-4 pt-14 pb-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">Explore</div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold">All Courses</h1>
          <p className="mt-4 text-muted-foreground">Find your next skill. Filter by category, sort by what matters to you.</p>
        </div>

        <div className="mt-10 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses or instructors..." className="pl-9 h-12" />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="lg:w-48 h-12"><SlidersHorizontal className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="students">Most Students</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Button key={c} size="sm" variant={cat === c ? "hero" : "outline"} onClick={() => setCat(c)}>{c}</Button>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="text-sm text-muted-foreground mb-6">
          {isLoading ? "Loading courses..." : `${filtered.length} ${filtered.length === 1 ? "course" : "courses"}`}
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-border">
            <Search className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-3 font-medium">No courses found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
