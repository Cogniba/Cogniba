"use client";

import { ThemeProvider } from "@/components/ThemeProvider";

interface RootLayoutWrapperProps {
  readonly children: React.ReactNode;
}

export default function RootLayoutWrapper({
  children,
}: RootLayoutWrapperProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
