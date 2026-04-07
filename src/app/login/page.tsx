import { Suspense } from "react";

import { LoginView } from "@/features/auth/login-view";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginView />
    </Suspense>
  );
}
