import React from 'react';
import { Chain, mainnet, sepolia } from '@starknet-react/chains';
import {
  StarknetConfig,
  argent,
  braavos,
  useInjectedConnectors,
  voyager,
  InjectedConnector,
  jsonRpcProvider
} from '@starknet-react/core';

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [
      argent(),
      braavos(),
      new InjectedConnector({
        options: { id: 'okxwallet' }
      })
    ],
    // Hide recommended connectors if the user has any connector installed.
    includeRecommended: 'onlyIfNoConnectors',
    // Randomize the order of the connectors.
    order: 'random'
  });

  console.log('StarknetProvider connectors:', connectors);

  return (
    <StarknetConfig
      chains={[sepolia]} // 只使用 sepolia 测试网
      connectors={connectors}
      explorer={voyager}
      autoConnect
      provider={jsonRpcProvider({
        rpc: (chain: Chain) => {
          console.log('RPC provider for chain:', chain);
          switch (chain) {
            case mainnet:
              return { nodeUrl: 'https://starknet-mainnet.public.blastapi.io' };
            case sepolia:
            default:
              return { nodeUrl: 'https://starknet-sepolia.public.blastapi.io' };
          }
        }
      })}
    >
      {children}
    </StarknetConfig>
  );
}
