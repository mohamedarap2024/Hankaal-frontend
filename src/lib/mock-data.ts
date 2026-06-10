import type { Course } from "./types";

export type { Course };

const covers = [
  "linear-gradient(135deg,#1e3a8a,#3b82f6)",
  "linear-gradient(135deg,#7c2d12,#ea580c)",
  "linear-gradient(135deg,#064e3b,#10b981)",
  "linear-gradient(135deg,#581c87,#a855f7)",
  "linear-gradient(135deg,#0c4a6e,#0ea5e9)",
  "linear-gradient(135deg,#831843,#ec4899)",
  "linear-gradient(135deg,#365314,#84cc16)",
  "linear-gradient(135deg,#1f2937,#f59e0b)",
];

const instructors = [
  { name: "Dr. Amina Yusuf", title: "Senior Software Engineer", avatar: "https://i.pravatar.cc/150?img=47", bio: "15+ years building scalable web platforms. Former lead at major tech firms." },
  { name: "Prof. Mahad Ali", title: "Data Scientist", avatar: "https://i.pravatar.cc/150?img=12", bio: "PhD in Machine Learning. Published author and industry consultant." },
  { name: "Fatima Hassan", title: "UX Design Lead", avatar: "https://i.pravatar.cc/150?img=45", bio: "Award-winning designer with experience at top design studios worldwide." },
  { name: "Omar Abdi", title: "Business Strategist", avatar: "https://i.pravatar.cc/150?img=33", bio: "MBA. Helped 200+ startups scale through smart growth strategies." },
];

const categories = ["Programming", "Design", "Business", "Data Science", "Marketing", "Languages"];

const titles = [
  "Complete Web Development Bootcamp",
  "Mastering UI/UX Design Principles",
  "Python for Data Science & ML",
  "Digital Marketing Mastery 2026",
  "Modern React & TypeScript",
  "Financial Accounting Fundamentals",
  "Graphic Design with Figma",
  "Business English for Professionals",
  "Mobile App Design Essentials",
  "Cloud Computing with AWS",
  "Data Visualization with D3.js",
  "Entrepreneurship & Startup Strategy",
];

export const courses: Course[] = titles.map((title, i) => {
  const inst = instructors[i % instructors.length];
  return {
    id: String(i + 1),
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    title,
    description: "A comprehensive program designed to take you from beginner to professional with hands-on projects and real-world skills.",
    longDescription: "This course is carefully crafted by industry experts at Hankaal College to deliver practical, in-demand skills. You'll work through real projects, get feedback from instructors, and join a community of motivated learners building their futures.",
    instructor: inst,
    category: categories[i % categories.length],
    level: (["Beginner", "Intermediate", "Advanced"] as const)[i % 3],
    rating: 4.5 + ((i * 0.07) % 0.5),
    reviews: 200 + i * 87,
    students: 1200 + i * 540,
    duration: `${8 + (i % 12)}h ${15 + (i % 45)}m`,
    lessons: 32 + (i % 40),
    price: [29, 39, 49, 59, 69, 79][i % 6],
    originalPrice: [99, 129, 149, 159, 179, 199][i % 6],
    thumbnail: covers[i % covers.length],
    badge: i % 4 === 0 ? "Bestseller" : i % 5 === 0 ? "New" : undefined,
    objectives: [
      "Build production-grade projects from scratch",
      "Master industry best practices and patterns",
      "Land a job or freelance with confidence",
      "Earn a verified Hankaal College certificate",
      "Access to a private student community",
      "Lifetime updates as the field evolves",
    ],
    curriculum: [
      { section: "Getting Started", lessons: [{ title: "Welcome & course overview", duration: "5:20" }, { title: "Setting up your environment", duration: "12:40" }, { title: "Tools of the trade", duration: "9:15" }] },
      { section: "Core Foundations", lessons: [{ title: "Fundamentals deep-dive", duration: "18:30" }, { title: "Hands-on lab #1", duration: "24:10" }, { title: "Common pitfalls", duration: "11:05" }] },
      { section: "Building Projects", lessons: [{ title: "Project 1: From idea to MVP", duration: "32:00" }, { title: "Project 2: Real-world scenario", duration: "45:20" }, { title: "Code review session", duration: "21:35" }] },
      { section: "Going Professional", lessons: [{ title: "Industry standards", duration: "15:50" }, { title: "Portfolio & career prep", duration: "19:25" }, { title: "Final assessment", duration: "30:00" }] },
    ],
  };
});

export const testimonials = [
  { name: "Hodan A.", role: "Software Developer", avatar: "https://i.pravatar.cc/150?img=20", quote: "Hankaal College transformed my career. The instructors are world-class and the projects feel like real work." },
  { name: "Yusuf M.", role: "Product Designer", avatar: "https://i.pravatar.cc/150?img=15", quote: "I went from zero to landing my first design job in 6 months. The community support is unmatched." },
  { name: "Layla K.", role: "Data Analyst", avatar: "https://i.pravatar.cc/150?img=49", quote: "Practical, patient, progressive — exactly what their motto promises. Best investment I've made." },
];

export const faqs = [
  { q: "Do I get a certificate after completing a course?", a: "Yes, every Hankaal College course awards a verified certificate of completion you can share on LinkedIn or with employers." },
  { q: "Can I access courses on mobile?", a: "Absolutely. Our platform is fully responsive and works beautifully on phones, tablets, and desktops." },
  { q: "Is there a refund policy?", a: "We offer a 30-day money-back guarantee on all paid courses, no questions asked." },
  { q: "How long do I have access to a course?", a: "Once enrolled, you get lifetime access including all future updates to the course material." },
  { q: "Do you offer student discounts?", a: "Yes — verified students receive 30% off any paid course. Contact our support to learn more." },
];

export const stats = [
  { value: "50K+", label: "Active Students" },
  { value: "200+", label: "Expert Instructors" },
  { value: "350+", label: "Online Courses" },
  { value: "98%", label: "Satisfaction Rate" },
];

export const team = [
  { name: "Dr. Abdullahi Hankaal", role: "Founder & President", avatar: "https://i.pravatar.cc/300?img=68" },
  { name: "Sahra Mohamed", role: "Academic Director", avatar: "https://i.pravatar.cc/300?img=44" },
  { name: "Ibrahim Noor", role: "Head of Engineering", avatar: "https://i.pravatar.cc/300?img=60" },
  { name: "Maryan Farah", role: "Student Success Lead", avatar: "https://i.pravatar.cc/300?img=23" },
];