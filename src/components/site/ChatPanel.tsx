import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, MessageCircle, Send, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { WhatsAppLink } from "@/components/site/WhatsAppLink";
import { fetchChat, sendChatMessage } from "@/lib/api/chat";
import { toast } from "sonner";

export function orderRef(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}

type ChatPanelProps = {
  orderId: string;
  title?: string;
  subtitle?: string;
  /** When false, stops polling (e.g. collapsed accordion) */
  active?: boolean;
};

export function ChatPanel({ orderId, title, subtitle, active = true }: ChatPanelProps) {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();
  const ref = orderRef(orderId);

  useEffect(() => {
    setText("");
  }, [orderId]);

  const { data, isLoading } = useQuery({
    queryKey: ["chat", orderId],
    queryFn: () => fetchChat(orderId),
    enabled: !!orderId && active,
    refetchInterval: active ? 5000 : false,
  });

  const sendMut = useMutation({
    mutationFn: (msg: string) => sendChatMessage(orderId, msg),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["chat", orderId] });
    },
    onError: () => toast.error("Failed to send message"),
  });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
              <MessageCircle className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{title ?? "Private Order Chat"}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge variant="outline" className="text-[10px] font-mono">Order #{ref}</Badge>
              {subtitle && <span className="text-xs text-muted-foreground truncate">{subtitle}</span>}
            </div>
          </div>
          {data?.whatsappUrl && <WhatsAppLink href={data.whatsappUrl} label="WhatsApp" />}
        </div>
      </div>

      {data?.whatsappUrl && (
        <div className="px-4 py-2.5 bg-[#25D366]/10 border-b border-[#25D366]/20">
          <WhatsAppLink
            href={data.whatsappUrl}
            label="WhatsApp — fast reply"
            variant="button"
            className="w-full text-sm"
          />
        </div>
      )}

      <div className="h-52 overflow-y-auto p-4 space-y-3 bg-background/50">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your messages...</p>
        ) : data?.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No messages yet. This chat is only for order <strong>#{ref}</strong>.
          </p>
        ) : (
          data?.messages.map((m) => {
            const isAdmin = m.senderRole === "admin";
            return (
              <div key={m.id} className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                    m.isMine
                      ? "bg-primary text-primary-foreground"
                      : isAdmin
                        ? "bg-amber-500/15 border border-amber-500/25"
                        : "bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] opacity-80 mb-0.5">
                    {isAdmin && <Shield className="h-3 w-3" />}
                    <span>{m.isMine ? "You" : m.senderName}</span>
                    {isAdmin && !m.isMine && <span className="text-amber-700 dark:text-amber-400">· Admin</span>}
                    <span className="ml-auto pl-2 opacity-60">
                      {new Date(m.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {m.message}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        className="p-3 border-t border-border flex gap-2 bg-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) sendMut.mutate(text.trim());
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message about order #${ref}...`}
          className="h-9"
        />
        <Button type="submit" size="icon" disabled={sendMut.isPending || !orderId}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
