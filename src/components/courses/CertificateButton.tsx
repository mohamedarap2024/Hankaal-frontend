import { Award } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadCertificate, makeCertificateId } from "@/lib/certificate";

type ButtonVariant = "hero" | "accent" | "outline" | "ghost" | "link" | "default";

type CertificateButtonProps = {
  studentName: string;
  courseTitle: string;
  instructorName?: string;
  enrollmentId: string;
  completedAt?: string;
  label?: string;
  variant?: ButtonVariant;
  className?: string;
};

export function CertificateButton({
  studentName,
  courseTitle,
  instructorName,
  enrollmentId,
  completedAt,
  label = "Certificate",
  variant = "accent",
  className,
}: CertificateButtonProps) {
  const handleDownload = async () => {
    try {
      await downloadCertificate({
        studentName,
        courseTitle,
        instructorName,
        date: completedAt,
        certificateId: makeCertificateId(enrollmentId),
      });
      toast.success("Certificate downloaded!");
    } catch {
      toast.error("Could not generate certificate. Please try again.");
    }
  };

  return (
    <Button variant={variant} className={className} onClick={handleDownload}>
      <Award className="h-4 w-4" /> {label}
    </Button>
  );
}
