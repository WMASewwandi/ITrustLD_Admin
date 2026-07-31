"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewBlogRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/content/blogs");
  }, [router]);

  return null;
}
