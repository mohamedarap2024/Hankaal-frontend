import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { resolveMediaUrl } from "@/lib/media";
import { ApiError } from "@/lib/api/client";

/** Center-crop and shrink an image file to a small square JPEG data URL (stored in the DB). */
function fileToAvatarDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const min = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

export function ProfileEditor() {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const adminLogo = "/hankaal-logo.png";
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatarUrl ?? (user?.role === "admin" ? adminLogo : ""));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Track which exact src failed, so a freshly uploaded photo always gets a clean attempt.
  const [erroredSrc, setErroredSrc] = useState<string | null>(null);

  if (!user) return null;

  const preview = resolveMediaUrl(avatar) || (user.role === "admin" ? adminLogo : undefined);
  const showImg = !!preview && erroredSrc !== preview;

  const refreshEverywhere = () => {
    queryClient.invalidateQueries({ queryKey: ["instructors"] });
    queryClient.invalidateQueries({ queryKey: ["courses"] });
    queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
  };

  const pickImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        // Store the image as a small data URL in the DB — no filesystem/proxy needed,
        // so it works identically in dev, production, and after redeploys.
        const dataUrl = await fileToAvatarDataUrl(file);
        setAvatar(dataUrl);
        setErroredSrc(null);
        await updateProfile({ avatarUrl: dataUrl });
        refreshEverywhere();
        toast.success("Profile photo updated!");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not update photo");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const save = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), avatarUrl: avatar });
      refreshEverywhere();
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const dirty = name !== (user.name ?? "") || avatar !== (user.avatarUrl ?? "");

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative shrink-0">
          <div className="h-24 w-24 rounded-full overflow-hidden border border-border bg-muted grid place-items-center">
            {showImg ? (
              <img
                key={preview}
                src={preview}
                alt={user.name}
                className="h-full w-full object-cover"
                onError={() => setErroredSrc(preview ?? null)}
              />
            ) : (
              <UserIcon className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <button
            type="button"
            onClick={pickImage}
            disabled={uploading}
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center shadow hover:bg-primary/90"
            aria-label="Upload photo"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email} disabled className="opacity-70" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="hero" onClick={save} disabled={saving || uploading || !dirty}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
            <span className="text-xs text-muted-foreground capitalize">Role: {user.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
