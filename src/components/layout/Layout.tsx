
import { Header } from "./Header";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden relative bg-background">
      <Header />
      <main className="flex-1 overflow-auto p-4 md:p-6 relative" style={{ isolation: "isolate" }}>
        <Outlet />
      </main>
    </div>
  );
}
