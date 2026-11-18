"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function ConditionalNavbar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/complete-profile"
  ) {
    return null;
  }
  
  return <>{children}</>;
}
