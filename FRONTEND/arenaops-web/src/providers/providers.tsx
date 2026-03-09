"use client";

import { Provider } from "react-redux";
import { store } from "@/app/store/store";
import { useEffect } from "react";
import { initializeAuth } from "@/app/store/authSlice";
import { ToastProvider, ToastContainer, ErrorBoundary } from "@/components/ui";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(initializeAuth());
  }, []);

  return <>{children}</>;
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary errorTitle="Application Error">
      <Provider store={store}>
        <ToastProvider>
          <AuthInitializer>{children}</AuthInitializer>
          <ToastContainer />
        </ToastProvider>
      </Provider>
    </ErrorBoundary>
  );
}
