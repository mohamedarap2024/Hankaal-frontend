import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { SITE_CONTACT, ussdPaymentHint } from "@/lib/site-contact";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Trash2, CreditCard } from "lucide-react";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchCart, removeFromCart } from "@/lib/api/cart";
import { checkout, confirmPayment } from "@/lib/api/orders";
import { ChatPanel } from "@/components/site/ChatPanel";
import { WhatsAppLink } from "@/components/site/WhatsAppLink";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/cart")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("hankaal_token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: CartPage,
});

function CartPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(SITE_CONTACT.phoneDial);
  const [checkoutResult, setCheckoutResult] = useState<{
    orderId: string;
    ussdCode: string;
    amount: number;
    whatsappUrl: string;
    courseTitle: string;
  } | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["cart"], queryFn: fetchCart });

  const removeMut = useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const checkoutMut = useMutation({
    mutationFn: ({ courseId, paymentPhone }: { courseId: string; paymentPhone: string }) =>
      checkout(courseId, paymentPhone),
    onSuccess: (res) => {
      setCheckoutResult({
        orderId: res.order.id,
        ussdCode: res.order.ussdCode!,
        amount: res.order.amount,
        whatsappUrl: res.order.whatsappUrl ?? SITE_CONTACT.whatsappUrl,
        courseTitle: res.order.course.title,
      });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Order created. Please complete payment.");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Checkout failed"),
  });

  const confirmMut = useMutation({
    mutationFn: confirmPayment,
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed"),
  });

  const items = data?.items ?? [];

  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-display font-extrabold flex items-center gap-2">
          <ShoppingCart className="h-8 w-8 text-primary" /> Cart & Checkout
        </h1>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Loading cart...</p>
        ) : items.length === 0 && !checkoutResult ? (
          <div className="mt-12 text-center py-16 border border-dashed rounded-2xl">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-4 font-medium">Your cart is empty</p>
            <Button variant="hero" className="mt-4" asChild><Link to="/courses">Browse Courses</Link></Button>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {!checkoutResult && items.map((item) => (
              <div key={item.id} className="p-5 rounded-2xl border border-border bg-card flex gap-4 items-center">
                <div className="flex-1">
                  <h3 className="font-bold">{item.course.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.course.category} · ${item.course.price}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeMut.mutate(item.courseId)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            {!checkoutResult && items.length > 0 && (
              <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${data?.total ?? 0}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Payment Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder={SITE_CONTACT.phoneDial}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={!phone || checkoutMut.isPending}
                  onClick={() => checkoutMut.mutate({ courseId: items[0].courseId, paymentPhone: phone })}
                >
                  <CreditCard className="h-4 w-4" /> Proceed to Payment
                </Button>
              </div>
            )}

            {checkoutResult && (
              <div className="p-6 rounded-2xl border-2 border-primary bg-card space-y-4">
                <h2 className="font-display font-bold text-xl">Complete Payment</h2>
                <p className="text-muted-foreground">Course: <strong>{checkoutResult.courseTitle}</strong></p>
                <p className="text-muted-foreground">Amount: <strong>${checkoutResult.amount}</strong></p>

                <div className="p-4 rounded-xl bg-muted text-center space-y-2">
                  <p className="text-sm font-medium">Step 1 — Dial on your phone:</p>
                  <p className="text-2xl font-mono font-bold text-primary">{checkoutResult.ussdCode}</p>
                  <p className="text-xs text-muted-foreground">Format: {ussdPaymentHint(checkoutResult.amount)}</p>
                </div>

                <Button
                  variant="hero"
                  className="w-full"
                  disabled={confirmMut.isPending}
                  onClick={() => confirmMut.mutate(checkoutResult.orderId)}
                >
                  I Have Paid — Confirm Payment
                </Button>

                <div className="flex justify-center">
                  <WhatsAppLink
                    href={checkoutResult.whatsappUrl}
                    label="Contact us on WhatsApp after payment"
                    variant="button"
                    className="w-full max-w-sm"
                  />
                </div>

                <ChatPanel
                  orderId={checkoutResult.orderId}
                  title={`Chat: ${checkoutResult.courseTitle}`}
                  subtitle="Your private order chat"
                />

                <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/dashboard" })}>
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
