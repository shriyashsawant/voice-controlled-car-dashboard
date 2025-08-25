"use client";

import { CarCoPilotDashboard } from "@/components/CarCopilotDashboard";
import { Toaster } from "sonner";

export default function Page() {
  return (
    <>
      <CarCoPilotDashboard />

      {/* Toast Notifications */}
      <Toaster 
        position="bottom-right"
        richColors 
        closeButton
        toastOptions={{
          classNames: {
            toast: "bg-card border-border",
            title: "text-foreground",
            description: "text-muted-foreground"
          }
        }}
      />
    </>
  );
}