import { jsPDF } from "jspdf";

export type CertificateData = {
  studentName: string;
  courseTitle: string;
  instructorName?: string;
  /** ISO date string or anything Date can parse. Defaults to today. */
  date?: string;
  certificateId: string;
};

const NAVY: [number, number, number] = [15, 35, 75];
const GOLD: [number, number, number] = [193, 154, 60];
const SLATE: [number, number, number] = [71, 85, 105];

function formatDate(input?: string): string {
  const d = input ? new Date(input) : new Date();
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  return safe.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/** Build a deterministic, human-readable certificate id from an enrollment id. */
export function makeCertificateId(enrollmentId: string): string {
  const cleaned = enrollmentId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `HC-${cleaned || "00000000"}`;
}

/** Build a landscape A4 certificate PDF using only vector drawing (no assets). */
export function buildCertificate(data: CertificateData): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth(); // ~297mm
  const H = doc.internal.pageSize.getHeight(); // ~210mm
  const cx = W / 2;

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, "F");

  // Decorative double border
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(2);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.rect(12, 12, W - 24, H - 24);

  // Institution
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.setFontSize(22);
  doc.text("HANKAAL COLLEGE", cx, 32, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE);
  doc.text("ONLINE LEARNING PLATFORM", cx, 39, { align: "center" });

  // Title
  doc.setFont("times", "bold");
  doc.setFontSize(34);
  doc.setTextColor(...NAVY);
  doc.text("Certificate of Completion", cx, 62, { align: "center" });

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.line(cx - 55, 68, cx + 55, 68);

  // Recipient
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(...SLATE);
  doc.text("This is to certify that", cx, 86, { align: "center" });

  doc.setFont("times", "bolditalic");
  doc.setFontSize(40);
  doc.setTextColor(...NAVY);
  doc.text(data.studentName || "Student", cx, 104, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(...SLATE);
  doc.text("has successfully completed the course", cx, 119, { align: "center" });

  // Course title (wrapped, centered)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  const titleLines = doc.splitTextToSize(data.courseTitle || "Course", W - 90) as string[];
  doc.text(titleLines, cx, 133, { align: "center" });

  // Footer: date (left) and signature (right)
  const footerY = 178;

  doc.setDrawColor(...SLATE);
  doc.setLineWidth(0.3);
  doc.line(40, footerY, 105, footerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(formatDate(data.date), 72, footerY - 2, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text("DATE", 72, footerY + 6, { align: "center" });

  doc.setDrawColor(...SLATE);
  doc.setLineWidth(0.3);
  doc.line(W - 105, footerY, W - 40, footerY);
  doc.setFont("times", "italic");
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text(data.instructorName || "Hankaal College", W - 72, footerY - 2, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text("INSTRUCTOR", W - 72, footerY + 6, { align: "center" });

  // Certificate id
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text(`Certificate ID: ${data.certificateId}`, cx, H - 16, { align: "center" });

  return doc;
}

/** Build the certificate and trigger a browser download. */
export function downloadCertificate(data: CertificateData): void {
  const doc = buildCertificate(data);
  const slug =
    data.courseTitle
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase()
      .replace(/^-+|-+$/g, "") || "course";
  doc.save(`hankaal-certificate-${slug}.pdf`);
}
