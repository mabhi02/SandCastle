"use client";

import { ConvexProvider } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://scintillating-sturgeon-599.convex.cloud";

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const convex = useMemo(() => {
    console.log("Creating Convex client with URL:", CONVEX_URL);
    return new ConvexReactClient(CONVEX_URL);
  }, []);
  
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}
