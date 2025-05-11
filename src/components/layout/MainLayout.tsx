
import React from "react";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="container mx-auto py-4 max-w-screen-2xl">
      {children}
    </div>
  );
};
