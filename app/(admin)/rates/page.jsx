"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/admin/breadcrumb";
import RatesPanel from "@/components/admin/rates-panel";
import { RATES } from "@/lib/mock-data";

function RatesContent() {
  const params = useSearchParams();
  const [method, setMethod] = useState(params.get("method") || RATES[0].method);

  useEffect(() => {
    const fromUrl = params.get("method");
    if (fromUrl && RATES.some((r) => r.method === fromUrl)) {
      setMethod(fromUrl);
    } else if (!fromUrl) {
      setMethod(RATES[0].method);
    }
  }, [params]);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Configurations", href: "/configs" },
          { label: "Rates Management" },
          { label: method },
        ]}
      />
      <RatesPanel method={method} />
    </div>
  );
}

export default function RatesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading rates…</div>}>
      <RatesContent />
    </Suspense>
  );
}
