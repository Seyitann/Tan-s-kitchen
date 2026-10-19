import AdminView from "@/components/AdminView";

// Keeps search engines away from the owner page
export const metadata = {
  title: "Orders | Tan's Kitchen",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AdminView />
    </main>
  );
}
