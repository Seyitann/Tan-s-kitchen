import CheckoutView from "@/components/CheckoutView";

export const metadata = { title: "Checkout | Tan's Kitchen" };

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 font-[family-name:var(--font-heading)] text-3xl font-bold">
        Checkout
      </h1>
      <CheckoutView />
    </main>
  );
}
