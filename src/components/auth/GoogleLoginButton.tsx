import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/lib/types";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (el: HTMLElement, config: Record<string, string>) => void;
        };
      };
    };
  }
}

export function GoogleLoginButton({ onSuccess }: { onSuccess: (user: User) => void }) {
  const { googleLogin } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CLIENT_ID || !ref.current) return;

    const init = () => {
      if (!window.google || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          try {
            const user = await googleLogin(response.credential);
            onSuccess(user);
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Google login failed");
          }
        },
      });
      ref.current.innerHTML = "";
      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline",
        size: "large",
        width: "100%",
        text: "continue_with",
        shape: "rectangular",
      });
    };

    if (window.google) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [onSuccess, googleLogin]);

  if (!CLIENT_ID) {
    return (
      <p className="text-xs text-center text-muted-foreground">
        Google login: set VITE_GOOGLE_CLIENT_ID in .env
      </p>
    );
  }

  return <div ref={ref} className="w-full flex justify-center [&>div]:w-full" />;
}
