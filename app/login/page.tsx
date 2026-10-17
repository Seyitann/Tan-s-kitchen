import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Log in | Tan's Kitchen" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <Suspense fallback={null}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
