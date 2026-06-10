import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadFile } from "@/lib/api/uploads";
import { resolveMediaUrl } from "@/lib/media";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";

type MediaUploadFieldProps = {
  label: string;
  type: "image" | "video";
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
};

export function MediaUploadField({ label, type, value, onChange, placeholder }: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const preview = resolveMediaUrl(value);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadFile(file, type);
      onChange(url);
      toast.success(`${type === "image" ? "Image" : "Video"} uploaded`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? `Upload ${type} or paste URL`}
        />
        <input
          ref={inputRef}
          type="file"
          accept={type === "image" ? "image/*" : "video/*"}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
      </div>
      {type === "image" && preview && !preview.startsWith("linear-gradient") && (
        <img src={preview} alt="Preview" className="h-24 rounded-lg object-cover border border-border" />
      )}
      {type === "video" && value && (
        <p className="text-xs text-muted-foreground truncate">{value}</p>
      )}
    </div>
  );
}
