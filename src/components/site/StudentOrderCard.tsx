import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, CreditCard, MessageCircle } from "lucide-react";
import { WhatsAppLink, WHATSAPP_URL } from "@/components/site/WhatsAppLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatPanel, orderRef } from "@/components/site/ChatPanel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { confirmPayment } from "@/lib/api/orders";
import type { Order } from "@/lib/types";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type StudentOrderCardProps = {
  order: Order;
};

export function StudentOrderCard({ order }: StudentOrderCardProps) {
  const queryClient = useQueryClient();
  const [chatOpen, setChatOpen] = useState(false);
  const ref = orderRef(order.id);

  const confirmMut = useMutation({
    mutationFn: () => confirmPayment(order.id),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      setChatOpen(true);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to confirm"),
  });

  const whatsappUrl = order.whatsappUrl ?? WHATSAPP_URL;
  const showPayment = order.status === "pending_payment";
  const awaitingApproval = order.status === "paid";
  const isApproved = order.status === "approved";

  return (
    <div className="p-5 rounded-2xl border-2 border-border bg-card space-y-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-mono">#{ref}</Badge>
            <Badge variant={isApproved ? "default" : awaitingApproval ? "secondary" : "outline"}>
              {order.status.replace("_", " ")}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg">{order.course.title}</h3>
          <p className="text-sm text-muted-foreground">${order.amount}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your private order — only you and admin can see this chat.
          </p>
        </div>
      </div>

      {showPayment && order.ussdCode && (
        <div className="p-4 rounded-xl bg-muted/60 space-y-3 border border-border">
          <p className="text-sm font-medium">Step 1 — Pay on your phone</p>
          <p className="text-xs text-muted-foreground">Dial this USSD code for order #{ref}:</p>
          <p className="text-xl font-mono font-bold text-primary text-center py-2">{order.ussdCode}</p>
          <p className="text-xs text-muted-foreground text-center">Format: *712*614554731*amount#</p>
          <Button
            variant="hero"
            className="w-full"
            disabled={confirmMut.isPending}
            onClick={() => confirmMut.mutate()}
          >
            <CreditCard className="h-4 w-4" /> Step 2 — I Have Paid
          </Button>
        </div>
      )}

      {awaitingApproval && (
        <p className="text-sm text-muted-foreground p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          Payment received for <strong>{order.course.title}</strong>. Open your private chat below or use WhatsApp — admin will approve order #{ref}.
        </p>
      )}

      {isApproved && (
        <p className="text-sm text-green-600 font-medium p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          Approved — open the course in My Courses.
        </p>
      )}

      {!isApproved && (
        <>
          <div className="flex flex-wrap gap-3 text-sm items-center">
            <WhatsAppLink href={whatsappUrl} label="WhatsApp" variant="button" />
          </div>

          <Collapsible open={chatOpen} onOpenChange={setChatOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Private chat — Order #{ref}
                </span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", chatOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <ChatPanel
                orderId={order.id}
                title={`Chat: ${order.course.title}`}
                subtitle="Only for this order"
                active={chatOpen}
              />
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </div>
  );
}
