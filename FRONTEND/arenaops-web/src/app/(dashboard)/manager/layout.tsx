//src\app\(dashboard)\manager\layout.tsx
"use client";

import Sidebar from "@/components/dashboard/sideBar";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex bg-black overflow-hidden">

      <Sidebar />

      <main className="flex-1 bg-gray-100 lg:rounded-l-3xl overflow-hidden">
        {children}
      </main>

    </div>
  );
}
  
  


  // "use client";
    
    // import Sidebar from "@/components/dashboard/sideBar";
    
    // export default function ManagerLayout({
    //   children,
    // }: {
    //   children: React.ReactNode;
    // }) {
    //   return (
    //     <div className="min-h-screen flex">
    //       <Sidebar/>
    //       <main className="flex-1 p-6 bg-gray-100 h-[calc(100vh-72px)] overflow-hidden rounded-tl-3xl">
    //         {children}
    //       </main>
    //     </div>
    //   );
    // }
    