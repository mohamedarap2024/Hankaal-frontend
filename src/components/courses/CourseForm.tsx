import { useState } from "react";
import { Plus, Trash2, BookOpen, HelpCircle, Target, ListVideo, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaUploadField } from "@/components/courses/MediaUploadField";
import { uploadFile } from "@/lib/api/uploads";
import type { CreateCoursePayload, CurriculumSection, QuizQuestion } from "@/lib/api/instructor";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";

const CATEGORIES = ["Programming", "Design", "Business", "Data Science", "Marketing", "Languages"];

const emptySection = (): CurriculumSection => ({
  section: "New Section",
  lessons: [{ title: "Lesson 1", duration: "10:00", videoUrl: "" }],
});

const emptyLessonQuiz = (): QuizQuestion[] => [
  { question: "Sample question?", options: ["Option A", "Option B", "Option C"], correctIndex: 0 },
];

type CourseFormProps = {
  onSubmit: (data: CreateCoursePayload) => void;
  loading?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  initialValues?: CreateCoursePayload;
};

export function CourseForm({ onSubmit, loading, submitLabel = "Save Course", onCancel, initialValues }: CourseFormProps) {
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">(initialValues?.level ?? "Beginner");
  const [category, setCategory] = useState(initialValues?.category ?? "Programming");
  const [objectives, setObjectives] = useState(initialValues?.objectives ?? ["Learn core concepts", "Build real projects", "Earn a certificate"]);
  const [curriculum, setCurriculum] = useState<CurriculumSection[]>(initialValues?.curriculum ?? [emptySection()]);
  const [isFree, setIsFree] = useState(initialValues?.isFree ?? false);
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(initialValues?.videoUrl ?? "");
  const [thumbnail, setThumbnail] = useState(initialValues?.thumbnail ?? "");
  const [lessonUploading, setLessonUploading] = useState<string | null>(null);

  const handleLessonVideoUpload = async (si: number, li: number, file: File) => {
    const key = `${si}-${li}`;
    setLessonUploading(key);
    try {
      const { url } = await uploadFile(file, "video");
      const next = [...curriculum];
      next[si].lessons[li] = { ...next[si].lessons[li], videoUrl: url };
      setCurriculum(next);
      toast.success("Lesson video uploaded");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setLessonUploading(null);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    onSubmit({
      title: form.get("title") as string,
      description: form.get("description") as string,
      longDescription: form.get("longDescription") as string,
      category,
      level,
      isFree,
      price: isFree ? 0 : Number(form.get("price")),
      originalPrice: isFree ? undefined : Number(form.get("originalPrice")) || undefined,
      duration: form.get("duration") as string,
      imageUrl: imageUrl || undefined,
      videoUrl: videoUrl || undefined,
      thumbnail: thumbnail || imageUrl || undefined,
      badge: (form.get("badge") as string) || undefined,
      objectives: objectives.filter((o) => o.trim()),
      curriculum: curriculum
        .filter((s) => s.section.trim() && s.lessons.length > 0)
        .map((s) => ({
          ...s,
          lessons: s.lessons.map((l) => ({
            ...l,
            quiz: l.quiz?.questions?.some((q) => q.question.trim()) ? l.quiz : undefined,
          })),
        })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-6 rounded-2xl border border-border bg-card">
      <div>
        <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" /> Basic Info
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <Label>Course Title *</Label>
            <Input name="title" defaultValue={initialValues?.title} placeholder="e.g. Complete Web Development Bootcamp" required />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Short Description *</Label>
            <Textarea name="description" rows={2} defaultValue={initialValues?.description} placeholder="Brief summary for course cards" required />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Full Description *</Label>
            <Textarea name="longDescription" rows={4} defaultValue={initialValues?.longDescription} placeholder="Detailed course overview" required />
          </div>
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Level *</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Course Type *</Label>
            <Select value={isFree ? "free" : "paid"} onValueChange={(v) => setIsFree(v === "free")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid Course — students pay via cart</SelectItem>
                <SelectItem value="free">Free Course — students enroll instantly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isFree && (
            <>
              <div className="space-y-2">
                <Label>Price ($) *</Label>
                <Input name="price" type="number" min={1} defaultValue={initialValues?.price ?? 49} required />
              </div>
              <div className="space-y-2">
                <Label>Original Price ($)</Label>
                <Input name="originalPrice" type="number" min={0} defaultValue={initialValues?.originalPrice} placeholder="e.g. 99" />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Duration *</Label>
            <Input name="duration" defaultValue={initialValues?.duration ?? "10h 30m"} placeholder="e.g. 12h 45m" required />
          </div>
          <div className="space-y-2">
            <Label>Badge (optional)</Label>
            <Input name="badge" defaultValue={initialValues?.badge} placeholder="Bestseller, New, etc." />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
          <ListVideo className="h-5 w-5 text-primary" /> Images & Videos (Upload)
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <MediaUploadField label="Cover Image" type="image" value={imageUrl} onChange={setImageUrl} />
          <MediaUploadField label="Thumbnail (optional)" type="image" value={thumbnail} onChange={setThumbnail} placeholder="Or use cover image" />
          <div className="sm:col-span-2">
            <MediaUploadField label="Preview Video" type="video" value={videoUrl} onChange={setVideoUrl} placeholder="Upload video or YouTube URL" />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> Learning Objectives
          </h3>
          <Button type="button" size="sm" variant="outline" onClick={() => setObjectives([...objectives, ""])}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {objectives.map((obj, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={obj}
                onChange={(e) => {
                  const next = [...objectives];
                  next[i] = e.target.value;
                  setObjectives(next);
                }}
                placeholder={`Objective ${i + 1}`}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => setObjectives(objectives.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Curriculum & Lessons
          </h3>
          <Button type="button" size="sm" variant="outline" onClick={() => setCurriculum([...curriculum, emptySection()])}>
            <Plus className="h-4 w-4" /> Add Section
          </Button>
        </div>
        <div className="space-y-4">
          {curriculum.map((sec, si) => (
            <div key={si} className="p-4 rounded-xl border border-border bg-muted/30">
              <div className="flex gap-2 mb-3">
                <Input
                  value={sec.section}
                  onChange={(e) => {
                    const next = [...curriculum];
                    next[si] = { ...next[si], section: e.target.value };
                    setCurriculum(next);
                  }}
                  placeholder="Section name"
                  className="font-semibold"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setCurriculum(curriculum.filter((_, j) => j !== si))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {sec.lessons.map((lesson, li) => {
                const hasQuiz = !!lesson.quiz?.questions?.length;
                return (
                  <div key={li} className="mb-4 p-3 rounded-lg border border-border/60 bg-background/50">
                    <div className="grid sm:grid-cols-[1fr_100px_1fr_auto] gap-2 mb-2 items-center">
                      <Input
                        value={lesson.title}
                        onChange={(e) => {
                          const next = [...curriculum];
                          next[si].lessons[li] = { ...lesson, title: e.target.value };
                          setCurriculum(next);
                        }}
                        placeholder="Lesson title"
                      />
                      <Input
                        value={lesson.duration}
                        onChange={(e) => {
                          const next = [...curriculum];
                          next[si].lessons[li] = { ...lesson, duration: e.target.value };
                          setCurriculum(next);
                        }}
                        placeholder="10:30"
                      />
                      <Input
                        value={lesson.videoUrl ?? ""}
                        onChange={(e) => {
                          const next = [...curriculum];
                          next[si].lessons[li] = { ...lesson, videoUrl: e.target.value };
                          setCurriculum(next);
                        }}
                        placeholder="Video URL or upload"
                      />
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={lessonUploading === `${si}-${li}`}
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "video/*";
                            input.onchange = (ev) => {
                              const file = (ev.target as HTMLInputElement).files?.[0];
                              if (file) handleLessonVideoUpload(si, li, file);
                            };
                            input.click();
                          }}
                        >
                          {lessonUploading === `${si}-${li}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => {
                          const next = [...curriculum];
                          next[si].lessons = next[si].lessons.filter((_, j) => j !== li);
                          setCurriculum(next);
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      {!hasQuiz ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const next = [...curriculum];
                            next[si].lessons[li] = { ...lesson, quiz: { questions: emptyLessonQuiz() } };
                            setCurriculum(next);
                          }}
                        >
                          <HelpCircle className="h-3 w-3" /> Add Quiz for this Lesson
                        </Button>
                      ) : (
                        <div className="p-3 rounded-lg bg-muted/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold flex items-center gap-1">
                              <HelpCircle className="h-4 w-4 text-primary" /> Lesson Quiz
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const next = [...curriculum];
                                const { quiz: _, ...rest } = lesson;
                                next[si].lessons[li] = rest;
                                setCurriculum(next);
                              }}
                            >
                              Remove Quiz
                            </Button>
                          </div>
                          {lesson.quiz!.questions.map((q, qi) => (
                            <div key={qi} className="p-2 rounded bg-background space-y-2">
                              <Input
                                value={q.question}
                                onChange={(e) => {
                                  const next = [...curriculum];
                                  const questions = [...lesson.quiz!.questions];
                                  questions[qi] = { ...q, question: e.target.value };
                                  next[si].lessons[li] = { ...lesson, quiz: { questions } };
                                  setCurriculum(next);
                                }}
                                placeholder="Question"
                                className="h-8"
                              />
                              {q.options.map((opt, oi) => (
                                <div key={oi} className="flex gap-2 items-center">
                                  <input
                                    type="radio"
                                    name={`lesson-${si}-${li}-${qi}`}
                                    checked={q.correctIndex === oi}
                                    onChange={() => {
                                      const next = [...curriculum];
                                      const questions = [...lesson.quiz!.questions];
                                      questions[qi] = { ...q, correctIndex: oi };
                                      next[si].lessons[li] = { ...lesson, quiz: { questions } };
                                      setCurriculum(next);
                                    }}
                                  />
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const next = [...curriculum];
                                      const questions = [...lesson.quiz!.questions];
                                      const opts = [...q.options];
                                      opts[oi] = e.target.value;
                                      questions[qi] = { ...q, options: opts };
                                      next[si].lessons[li] = { ...lesson, quiz: { questions } };
                                      setCurriculum(next);
                                    }}
                                    placeholder={`Option ${oi + 1}`}
                                    className="h-8"
                                  />
                                </div>
                              ))}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const next = [...curriculum];
                                  const questions = [...lesson.quiz!.questions];
                                  questions[qi] = { ...q, options: [...q.options, ""] };
                                  next[si].lessons[li] = { ...lesson, quiz: { questions } };
                                  setCurriculum(next);
                                }}
                              >
                                + Option
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const next = [...curriculum];
                              const questions = [...lesson.quiz!.questions, { question: "", options: ["", ""], correctIndex: 0 }];
                              next[si].lessons[li] = { ...lesson, quiz: { questions } };
                              setCurriculum(next);
                            }}
                          >
                            + Question
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const next = [...curriculum];
                  next[si].lessons.push({ title: "", duration: "5:00", videoUrl: "" });
                  setCurriculum(next);
                }}
              >
                <Plus className="h-3 w-3" /> Add Lesson
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="hero" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
