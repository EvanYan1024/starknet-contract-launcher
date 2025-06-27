
import { useState } from 'react';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import DeploymentPanel from '@/components/DeploymentPanel';
import { Contract } from '@/types/contract';

const Index = () => {
  const [uploadedContracts, setUploadedContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const handleContractUpload = (contract: Contract) => {
    setUploadedContracts(prev => [...prev, contract]);
  };

  const handleContractSelect = (contract: Contract) => {
    setSelectedContract(contract);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/10">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Starknet Contract Deployer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Deploy your Starknet smart contracts with ease. Simply drag and drop your compiled contract files and deploy to the network.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <FileUpload
              onContractUpload={handleContractUpload}
              uploadedContracts={uploadedContracts}
              onContractSelect={handleContractSelect}
            />
          </div>

          <div>
            {selectedContract && (
              <DeploymentPanel
                contract={selectedContract}
                onClose={() => setSelectedContract(null)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
