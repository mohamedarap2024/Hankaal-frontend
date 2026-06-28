import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, MessageCircle, Undo2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatPanel, orderRef } from "@/components/site/ChatPanel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { approveOrder, unapproveOrder } from "@/lib/api/admin";
import type { AdminOrder } from "@/lib/api/admin";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type AdminOrderCardProps = {
  order: AdminOrder;
  onDelete?: () => void;
};

export function AdminOrderCard({ order, onDelete }: AdminOrderCardProps) {
  const queryClient = useQueryClient();
  const [chatOpen, setChatOpen] = useState(false);
  const ref = orderRef(order.id);

  const approveMut = useMutation({
    mutationFn: () => approveOrder(order.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      toast.success("Order approved — student can access the course");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to approve"),
  });

  const unapproveMut = useMutation({
    mutationFn: () => unapproveOrder(order.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      toast.success("Order unapproved — student access removed");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to unapprove"),
  });

  const canApprove = order.status === "paid" || order.status === "pending_payment";
  const isApproved = order.status === "approved";

  return (
    <div className="p-5 rounded-2xl border-2 border-border bg-card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className="font-mono text-[10px]">#{ref}</Badge>
            <Badge variant="outline">{order.status.replace("_", " ")}</Badge>
          </div>
          <div className="font-semibold text-lg">{order.courseTitle}</div>
          <div className="text-sm text-muted-foreground mt-1">
            <span className="font-medium text-foreground">{order.userName}</span>
            {" · "}
            {order.userEmail}
          </div>
          <div className="text-sm mt-1">${order.amount}</div>
          {order.ussdCode && (
            <div className="text-xs font-mono text-muted-foreground mt-1">USSD: {order.ussdCode}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {canApprove && (
            <Button size="sm" variant="hero" disabled={approveMut.isPending} onClick={() => approveMut.mutate()}>
              Approve & Unlock
            </Button>
          )}
          {isApproved && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              disabled={unapproveMut.isPending}
              onClick={() => {
                if (window.confirm(`Unapprove order #${ref} for ${order.userName}? This removes their course access.`)) {
                  unapproveMut.mutate();
                }
              }}
            >
              <Undo2 className="h-3.5 w-3.5" /> Unapprove
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          )}
        </div>
      </div>

      <Collapsible open={chatOpen} onOpenChange={setChatOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2 truncate">
              <MessageCircle className="h-4 w-4 text-primary shrink-0" />
              Chat with {order.userName} — #{ref}
            </span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", chatOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <ChatPanel
            orderId={order.id}
            title={`${order.userName} — ${order.courseTitle}`}
            subtitle={order.userEmail}
            active={chatOpen}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
