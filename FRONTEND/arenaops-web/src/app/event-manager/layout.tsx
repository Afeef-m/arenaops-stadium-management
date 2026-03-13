import EventManagerNavbar from "@/components/navfooter/EventManagerNavbar";
import EventManagerFooter from "@/components/navfooter/EventManagerFooter";

export default function EventManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden font-display text-slate-100 bg-background-dark selection:bg-primary selection:text-background-dark">
      <EventManagerNavbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <EventManagerFooter />
    </div>
  );
}
