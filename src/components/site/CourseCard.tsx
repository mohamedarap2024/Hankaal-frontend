import { Link, useNavigate } from "@tanstack/react-router";
import { Star, Users, Clock, ShoppingCart, PlayCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Course } from "@/lib/types";
import { isGradient, resolveMediaUrl } from "@/lib/media";
import { useAuth } from "@/contexts/AuthContext";
import { addToCart } from "@/lib/api/cart";
import { enrollInCourse, fetchEnrollments } from "@/lib/api/enrollments";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const cover = resolveMediaUrl(course.imageUrl);
  const thumbStyle = isGradient(course.thumbnail) ? course.thumbnail : undefined;
  const isFree = course.isFree || course.price === 0;
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [acting, setActing] = useState(false);

  const isStudent = !user || user.role === "student";

  // Already-enrolled students go straight to the lesson player when they click the card.
  const { data: enrollmentsData } = useQuery({
    queryKey: ["enrollments"],
    queryFn: fetchEnrollments,
    enabled: !!user && isStudent,
    staleTime: 60_000,
  });
  const isEnrolled = enrollmentsData?.enrollments?.some((e) => e.courseId === course.id) ?? false;

  const handlePrimaryAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info("Please log in first");
      navigate({ to: "/login" });
      return;
    }

    if (!isStudent) {
      navigate({ to: "/courses/$courseId", params: { courseId: course.slug } });
      return;
    }

    setActing(true);
    try {
      if (isFree) {
        await enrollInCourse(course.id);
        await queryClient.invalidateQueries({ queryKey: ["enrollments"] });
        toast.success("Enrolled! Start learning now.");
        navigate({ to: "/learn/$courseId", params: { courseId: course.slug } });
      } else {
        await addToCart(course.id);
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
        toast.success("Added to cart — complete payment next.");
        navigate({ to: "/cart" });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.message.includes("Already enrolled")) {
          toast.info("You are already enrolled");
          navigate({ to: "/learn/$courseId", params: { courseId: course.slug } });
        } else if (err.message.includes("already in cart")) {
          toast.info("Already in cart");
          navigate({ to: "/cart" });
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error(isFree ? "Failed to enroll" : "Failed to add to cart");
      }
    } finally {
      setActing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: (index % 8) * 0.05 }}
      className="group rounded-xl overflow-hidden bg-card border border-border hover:border-primary/40 hover:shadow-[var(--shadow-card)] transition-all flex flex-col"
    >
      <Link to="/courses/$courseId" params={{ courseId: course.slug }} className="block">
        <div className="aspect-video relative overflow-hidden" style={thumbStyle ? { background: thumbStyle } : undefined}>
          {cover && !isGradient(cover) ? (
            <img src={cover} alt={course.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-white/90 font-display font-bold text-2xl text-center px-6 group-hover:scale-105 transition-transform" style={{ background: course.thumbnail }}>
              {course.category}
            </div>
          )}
          {course.badge && (
            <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground border-0">{course.badge}</Badge>
          )}
          {isFree && (
            <Badge className="absolute bottom-3 left-3 bg-green-600 text-white border-0">Free</Badge>
          )}
          <Badge variant="secondary" className="absolute top-3 right-3 bg-background/90 backdrop-blur">{course.level}</Badge>
        </div>
      </Link>
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs text-muted-foreground mb-2">{course.category}</div>
        <Link to="/courses/$courseId" params={{ courseId: course.slug }}>
          <h3 className="font-display font-bold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-1.5">
          <img
            src={resolveMediaUrl(course.instructor.avatar) || course.instructor.avatar}
            alt={course.instructor.name}
            className="h-5 w-5 rounded-full object-cover bg-muted shrink-0"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://i.pravatar.cc/150?img=68"; }}
          />
          <p className="text-sm text-muted-foreground truncate">by {course.instructor.name}</p>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-accent font-semibold">
            <Star className="h-3.5 w-3.5 fill-current" /> {course.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.students.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration}</span>
        </div>
        <div className="mt-auto pt-4 border-t border-border mt-4 space-y-3">
          <div className="flex items-baseline gap-2">
            {isFree ? (
              <span className="text-lg font-bold text-green-600">Free</span>
            ) : (
              <>
                <span className="text-lg font-bold text-foreground">${course.price}</span>
                {course.originalPrice && (
                  <span className="text-xs text-muted-foreground line-through">${course.originalPrice}</span>
                )}
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {isEnrolled ? (
              <Button size="sm" variant="hero" className="w-full" asChild>
                <Link to="/learn/$courseId" params={{ courseId: course.slug }}>
                  <PlayCircle className="h-3.5 w-3.5" /> Continue Learning
                </Link>
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" className="flex-1 min-w-[100px]" asChild>
                  <Link to="/courses/$courseId" params={{ courseId: course.slug }}>View</Link>
                </Button>
                {isStudent && (
                  <Button
                    size="sm"
                    variant="hero"
                    className="flex-1 min-w-[120px]"
                    disabled={acting}
                    onClick={handlePrimaryAction}
                  >
                    {acting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isFree ? (
                      <>
                        <PlayCircle className="h-3.5 w-3.5" /> Enroll Free
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
