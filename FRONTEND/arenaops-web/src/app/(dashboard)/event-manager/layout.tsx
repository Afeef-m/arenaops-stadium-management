"use client";

import EventManagerSidebar from "@/components/dashboard/EventManagerSidebar";

export default function EventManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-black text-white font-sans selection:bg-[#10b981] selection:text-black">
      {/* Dynamic Sidebar */}
      <EventManagerSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 relative overflow-y-auto custom-scrollbar">
        {/* subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#10b981]/5 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#10b981]/5 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
        <div className="absolute inset-0 stadium-grid opacity-10 pointer-events-none -z-10"></div>

        {/* Header could go here */}
        <main className="flex-1 w-full max-w-7xl mx-auto z-10 p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
