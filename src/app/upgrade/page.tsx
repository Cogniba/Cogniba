"use client";

import { useToast } from "@/hooks/use-toast";

export default function UpgradePage() {
  const { toast } = useToast();

  const handleCheckout = async () => {
    const response = await fetch("/api/stripe/checkoutSession", {
      method: "POST",
    });

    if (!response.ok) {
      toast({ title: "Unexpected error ocurred", variant: "destructive" });
    } else {
      const { url } = await response.json();
      window.location.assign(url as string);
    }
  };

  return (
    <div>
      <button onClick={handleCheckout}>Upgrade</button>
    </div>
  );
}
