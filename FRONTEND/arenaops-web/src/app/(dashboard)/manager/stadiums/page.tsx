"use client";

import { LayoutEditor } from "@/features/stadium-manager/layout-editor";

export default function StadiumManagerPage() {
  return (
    <div className="pt-[72px] h-[calc(100vh-72px)] overflow-hidden">
      <LayoutEditor />
    </div>
  );
}
