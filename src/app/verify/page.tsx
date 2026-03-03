export const dynamic = "force-dynamic";

import { Suspense } from "react";
import VerifyContent from "./VerifyContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Verifying...</div>}>
      <VerifyContent />
    </Suspense>
  );
}