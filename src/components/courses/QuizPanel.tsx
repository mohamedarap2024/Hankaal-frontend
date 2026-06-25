import { useState } from "react";
import { HelpCircle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Quiz } from "@/lib/types";

export function QuizPanel({
  quizzes,
  autoStart,
  onComplete,
}: {
  quizzes: Quiz[];
  autoStart?: boolean;
  /** Called when a quiz is submitted. `passed` is true when the score is 60% or higher. */
  onComplete?: (quizId: string, passed: boolean) => void;
}) {
  const [activeQuiz, setActiveQuiz] = useState<number | null>(autoStart && quizzes.length === 1 ? 0 : null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (quizzes.length === 0) return null;

  const quiz = activeQuiz !== null ? quizzes[activeQuiz] : null;

  const handleSubmit = () => {
    setSubmitted(true);
    if (quiz) {
      const correct = quiz.questions.filter((q, i) => answers[`${activeQuiz}-${i}`] === q.correctIndex).length;
      const passed = correct / Math.max(quiz.questions.length, 1) >= 0.6;
      onComplete?.(quiz.id ?? `quiz-${activeQuiz}`, passed);
    }
  };

  const score = quiz
    ? quiz.questions.filter((q, i) => answers[`${activeQuiz}-${i}`] === q.correctIndex).length
    : 0;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-primary" /> Course Quizzes
      </h2>

      {activeQuiz === null ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {quizzes.map((q, i) => (
            <button
              key={q.id ?? i}
              type="button"
              onClick={() => { setActiveQuiz(i); setAnswers({}); setSubmitted(false); }}
              className="p-4 rounded-xl border border-border bg-card text-left hover:border-primary/40 transition-colors"
            >
              <div className="font-semibold">{q.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{q.questions.length} questions</div>
            </button>
          ))}
        </div>
      ) : quiz && (
        <div className="p-6 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">{quiz.title}</h3>
            <Button variant="outline" size="sm" onClick={() => { setActiveQuiz(null); setSubmitted(false); }}>
              Back to quizzes
            </Button>
          </div>

          <div className="space-y-6">
            {quiz.questions.map((q, qi) => {
              const key = `${activeQuiz}-${qi}`;
              const selected = answers[key];
              return (
                <div key={qi} className="space-y-3">
                  <p className="font-medium">{qi + 1}. {q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const isSelected = selected === oi;
                      const isCorrect = q.correctIndex === oi;
                      let cls = "w-full text-left p-3 rounded-lg border text-sm transition-colors ";
                      if (submitted) {
                        if (isCorrect) cls += "border-green-500 bg-green-500/10";
                        else if (isSelected) cls += "border-destructive bg-destructive/10";
                        else cls += "border-border";
                      } else {
                        cls += isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/30";
                      }
                      return (
                        <button
                          key={oi}
                          type="button"
                          disabled={submitted}
                          onClick={() => setAnswers({ ...answers, [key]: oi })}
                          className={cls}
                        >
                          <span className="flex items-center gap-2">
                            {submitted && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
                            {submitted && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!submitted ? (
            <Button
              variant="hero"
              className="mt-6"
              disabled={quiz.questions.some((_, qi) => answers[`${activeQuiz}-${qi}`] === undefined)}
              onClick={handleSubmit}
            >
              Submit Quiz
            </Button>
          ) : (
            <div className="mt-6 p-4 rounded-xl bg-muted/50 text-center">
              <div className="text-2xl font-bold">{score} / {quiz.questions.length}</div>
              <div className="text-sm text-muted-foreground mt-1">correct answers</div>
              {score / Math.max(quiz.questions.length, 1) >= 0.6 ? (
                <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> Passed
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-destructive">
                    <XCircle className="h-4 w-4" /> Need 60% to pass
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setAnswers({}); setSubmitted(false); }}
                    >
                      Retry quiz
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
