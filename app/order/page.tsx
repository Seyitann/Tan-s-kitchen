import MyOrdersView from "@/components/MyOrdersView";

export const metadata = { title: "My orders | Tan's Kitchen" };

export default function OrdersPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 font-[family-name:var(--font-heading)] text-3xl font-bold">
        My orders
      </h1>
      <MyOrdersView />
    </main>
  );
}