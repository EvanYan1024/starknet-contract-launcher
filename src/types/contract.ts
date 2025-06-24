
export interface Contract {
  id: string;
  name: string;
  sierraData: any;
  casmData: any;
  abi: any[];
  classHash?: string;
  contractAddress?: string;
}

export interface DeploymentStep {
  id: string;
  title: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  description?: string;
}
