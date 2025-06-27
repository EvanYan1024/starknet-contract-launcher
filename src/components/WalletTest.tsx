import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { useStarknetkitConnectModal } from 'starknetkit';
import { Button } from './ui/button';

export const WalletTest = () => {
  const { account, address, status, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const { starknetkitConnectModal } = useStarknetkitConnectModal({
    connectors: connectors as any
  });

  async function connectWallet() {
    const { connector } = await starknetkitConnectModal();
    if (!connector) {
      return;
    }
    await connect({ connector });
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">Wallet Connection Test</h3>

      <div className="space-y-2 mb-4">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Is Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
        <p><strong>Address:</strong> {address || 'Not connected'}</p>
        <p><strong>Account Object:</strong> {account ? 'Available' : 'Not available'}</p>
        {account && (
          <div className="text-sm">
            <p><strong>Account Address:</strong> {account.address}</p>
            <p><strong>Account Type:</strong> {typeof account}</p>
          </div>
        )}
      </div>

      <div className="space-x-2">
        {!isConnected ? (
          <Button onClick={connectWallet}>
            Connect Wallet
          </Button>
        ) : (
          <Button onClick={() => disconnect()}>
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
};
