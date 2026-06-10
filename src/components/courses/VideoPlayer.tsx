import { PlayCircle } from "lucide-react";
import { getPlayableVideoUrl, getYouTubeEmbedUrl, isGradient, resolveMediaUrl } from "@/lib/media";

type VideoPlayerProps = {
  url?: string;
  title?: string;
  thumbnail?: string;
  className?: string;
};

export function VideoPlayer({ url, title, thumbnail, className = "aspect-video" }: VideoPlayerProps) {
  const embed = getYouTubeEmbedUrl(url);
  const direct = getPlayableVideoUrl(url);
  const image = resolveMediaUrl(url);

  if (embed) {
    return (
      <iframe
        src={embed}
        title={title ?? "Video"}
        className={`w-full h-full ${className}`}
        allowFullScreen
      />
    );
  }

  if (direct) {
    return (
      <video src={direct} controls className={`w-full h-full bg-black ${className}`}>
        Your browser does not support video playback.
      </video>
    );
  }

  if (image && !isGradient(image)) {
    return <img src={image} alt={title ?? "Course"} className={`w-full h-full object-cover ${className}`} />;
  }

  return (
    <div
      className={`w-full h-full grid place-items-center ${className}`}
      style={{ background: isGradient(thumbnail) ? thumbnail : thumbnail ?? "var(--gradient-hero)" }}
    >
      <PlayCircle className="h-16 w-16 text-white drop-shadow-lg" />
    </div>
  );
}
