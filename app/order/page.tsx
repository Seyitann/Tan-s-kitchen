import { Suspense } from "react";
import OrderView from "@/components/OrderView";

export const metadata = { title: "Your order | Tan's Kitchen" };

export default function OrderPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Suspense fallback={<p className="py-20 text-center text-stone-400">Loading your order...</p>}>
        <OrderView />
      </Suspense>
    </main>
  );
}
