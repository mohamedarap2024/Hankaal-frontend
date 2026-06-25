import { PlayCircle } from "lucide-react";
import { getPlayableVideoUrl, getVimeoEmbedUrl, getYouTubeEmbedUrl, isGradient, resolveMediaUrl } from "@/lib/media";

type VideoPlayerProps = {
  url?: string;
  title?: string;
  thumbnail?: string;
  className?: string;
  /** Start playing automatically. Browsers require muted playback for autoplay to work. */
  autoPlay?: boolean;
  /** Loop the video when it ends. */
  loop?: boolean;
};

export function VideoPlayer({ url, title, thumbnail, className = "aspect-video", autoPlay = false, loop = false }: VideoPlayerProps) {
  const embed = getYouTubeEmbedUrl(url);
  const vimeo = getVimeoEmbedUrl(url);
  const direct = getPlayableVideoUrl(url);
  const image = resolveMediaUrl(url);

  if (embed) {
    const params = new URLSearchParams();
    if (autoPlay) {
      params.set("autoplay", "1");
      params.set("mute", "1"); // required for autoplay in modern browsers
    }
    if (loop) {
      params.set("loop", "1");
      const id = embed.split("/embed/")[1];
      if (id) params.set("playlist", id); // YouTube loop needs the video id as playlist
    }
    const query = params.toString();
    return (
      <iframe
        src={query ? `${embed}?${query}` : embed}
        title={title ?? "Video"}
        className={`w-full h-full ${className}`}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
      />
    );
  }

  if (vimeo) {
    const sep = vimeo.includes("?") ? "&" : "?";
    const params = new URLSearchParams();
    if (autoPlay) {
      params.set("autoplay", "1");
      params.set("muted", "1"); // Vimeo uses "muted" — required for autoplay
    }
    if (loop) params.set("loop", "1");
    const query = params.toString();
    return (
      <iframe
        src={query ? `${vimeo}${sep}${query}` : vimeo}
        title={title ?? "Video"}
        className={`w-full h-full ${className}`}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (direct) {
    return (
      <video
        src={direct}
        controls
        autoPlay={autoPlay}
        muted={autoPlay} // muted is required for autoplay to be allowed
        loop={loop}
        playsInline
        className={`w-full h-full bg-black ${className}`}
      >
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
