"use client";

import React, { ReactNode } from "react";
import { WAGMI_CONFIG, WAGMI_ADAPTER, WAGMI_METADATA, WAGMI_CHAINS, WAGMI_CHAIN } from "./config";
import { CONFIG } from "@/lib/constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Config, State, WagmiProvider } from "wagmi";
import { createAppKit } from "@reown/appkit/react";

const queryClient = new QueryClient();

const modal = createAppKit({
	adapters: [WAGMI_ADAPTER],
	projectId: CONFIG.reownProjectId,
	// @ts-expect-error - AppKit networks type mismatch
	networks: WAGMI_CHAINS,
	defaultNetwork: WAGMI_CHAIN,
	metadata: WAGMI_METADATA,
	features: {
		analytics: true,
	},
	themeMode: "light",
	themeVariables: {
		"--w3m-color-mix": "#ff6b35",
		"--w3m-color-mix-strength": 10,
	},
});

export default function AppKitProvider({ children, initialState }: { children: ReactNode; initialState?: State }) {
  return (
    <WagmiProvider config={WAGMI_CONFIG as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
          {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
} 