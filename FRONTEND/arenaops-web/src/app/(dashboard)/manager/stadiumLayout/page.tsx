// // src\app\(dashboard)\manager\stadiums\page.tsx
"use client";

import { LayoutEditor } from "@/features/stadium-manager/layout-editor";

export default function StadiumLayoutPage() {
  return (
    <div className="flex w-full h-full overflow-hidden">
      <LayoutEditor />
    </div>
  );
}