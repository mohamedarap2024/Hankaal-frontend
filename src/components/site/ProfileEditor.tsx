import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFile } from "@/lib/api/uploads";
import { resolveMediaUrl } from "@/lib/media";
import { ApiError } from "@/lib/api/client";

export function ProfileEditor() {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const adminLogo = "/hankaal-logo.png";
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatarUrl ?? (user?.role === "admin" ? adminLogo : ""));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!user) return null;

  const preview = resolveMediaUrl(avatar) || (user.role === "admin" ? adminLogo : undefined);

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
        const { url } = await uploadFile(file, "image");
        setAvatar(url);
        setImgError(false);
        // Persist the photo immediately so it really saves and shows on courses.
        await updateProfile({ avatarUrl: url });
        refreshEverywhere();
        toast.success("Profile photo updated!");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Upload failed");
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
            {preview && !imgError ? (
              <img
                src={preview}
                alt={user.name}
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
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
