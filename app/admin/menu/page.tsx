import AdminMenu from "@/components/AdminMenu";

// Keeps search engines away from the owner page
export const metadata = {
  title: "Menu editor | Tan's Kitchen",
  robots: { index: false, follow: false },
};

export default function AdminMenuPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AdminMenu />
    </main>
  );
}
