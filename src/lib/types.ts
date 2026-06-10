export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  instructor: { name: string; avatar: string; title: string; bio: string };
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  rating: number;
  reviews: number;
  students: number;
  duration: string;
  lessons: number;
  isFree?: boolean;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  imageUrl?: string;
  videoUrl?: string;
  badge?: string;
  objectives: string[];
  curriculum: {
    section: string;
    lessons: {
      title: string;
      duration: string;
      videoUrl?: string;
      quiz?: { questions: { question: string; options: string[]; correctIndex: number }[] };
    }[];
  }[];
  status?: string;
};

export type Quiz = {
  id: string;
  title: string;
  questions: { question: string; options: string[]; correctIndex: number }[];
  lessonKey?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
  avatarUrl?: string;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type Enrollment = {
  id: string;
  courseId: string;
  enrolledAt: string;
  progress: number;
  course: Course;
};

export type Order = {
  id: string;
  courseId: string;
  amount: number;
  status: "pending_payment" | "paid" | "approved" | "rejected";
  paymentPhone?: string;
  ussdCode?: string;
  createdAt: string;
  paidAt?: string;
  approvedAt?: string;
  course: Course;
  whatsappUrl?: string;
};

export type ChatMessage = {
  id: string;
  message: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  isMine: boolean;
};

export type Stat = { value: string; label: string };
export type Testimonial = { id?: string; name: string; role: string; avatar: string; quote: string };
export type Faq = { q: string; a: string };
export type TeamMember = { id?: string; name: string; role: string; avatar: string };
