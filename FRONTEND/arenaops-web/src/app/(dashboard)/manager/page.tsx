// src/app/(dashboard)/manager/page.tsx

import ManagerDashboard from "./dashboard/page";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Content */}
      <div className="flex flex-col flex-1">

        {/* Page Header */}
        {/* <header className="h-14 border-b flex items-center px-6">
          Dashboard Header
        </header> */}
        <ManagerDashboard/>
        
      </div>
    </div>
  );
}