"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

const LayoutComponent = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const shouldShowSidebar = !(pathname === "/" || pathname.startsWith("/register"));

  return (
    <div className="flex">
      {shouldShowSidebar && <Sidebar />}
      {children}
    </div>
  );
};

export default LayoutComponent;
