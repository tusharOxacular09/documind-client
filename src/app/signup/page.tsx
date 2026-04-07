import { Suspense } from "react";

import { SignupView } from "@/features/auth/signup-view";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SignupView />
    </Suspense>
  );
}
