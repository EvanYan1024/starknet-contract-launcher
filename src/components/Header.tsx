
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { disconnect, useStarknetkitConnectModal } from 'starknetkit';
import { useAccount, useConnect } from '@starknet-react/core';
import { Wallet, LogOut, Shield, Github } from 'lucide-react';

const Header = () => {
  const { account, address, status } = useAccount();
  const [isConnecting, setIsConnecting] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('Header useAccount debug:', {
      account,
      address,
      status,
      accountType: typeof account,
      accountKeys: account ? Object.keys(account) : null
    });
  }, [account, address, status]);

  const { connect, connectors } = useConnect();

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

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Starknet Deployer</span>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://github.com/EvanYan1024/starknet-contract-launcher', '_blank')}
              className="hover:bg-accent/10 text-muted-foreground hover:text-foreground"
            >
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
            
            {status === 'connected' && address ? (
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/30">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  Connected
                </Badge>
                <span className="text-muted-foreground font-mono text-sm">
                  {formatAddress(address)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className="hover:bg-accent/10 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
