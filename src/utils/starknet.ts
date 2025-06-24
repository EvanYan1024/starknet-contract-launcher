
import { AccountInterface, CompiledSierraCasm, CompiledContract, extractContractHashes, hash } from 'starknet';

export interface DeclareResult {
  classHash: string;
  transactionHash?: string;
}

export interface DeployResult {
  contractAddress: string;
  transactionHash?: string;
}

export const declareContract = async (
  account: AccountInterface,
  sierraData: CompiledContract,
  casmData: CompiledSierraCasm
): Promise<DeclareResult> => {
  try {
    console.log('Starting contract declaration...');
    
    // Extract class hash
    const { classHash } = extractContractHashes({
      contract: sierraData,
      casm: casmData
    });

    console.log('Extracted class hash:', classHash);

    // Check if contract is already declared
    try {
      const existingClass = await account.getClassByHash(classHash);
      if (existingClass) {
        console.log('Contract already declared');
        return { classHash };
      }
    } catch (error) {
      // Contract not declared yet, proceed with declaration
      console.log('Contract not declared yet, proceeding...');
    }

    // Declare the contract
    const declareResponse = await account.declare({
      contract: sierraData,
      casm: casmData
    });

    console.log('Declare response:', declareResponse);

    // Wait for transaction confirmation
    const receipt = await account.waitForTransaction(declareResponse.transaction_hash);
    console.log('Declare receipt:', receipt);

    return {
      classHash: declareResponse.class_hash,
      transactionHash: declareResponse.transaction_hash
    };
  } catch (error: any) {
    console.error('Declare contract error:', error);
    throw new Error(`Failed to declare contract: ${error.message || error}`);
  }
};

export const deployContract = async (
  account: AccountInterface,
  classHash: string,
  constructorCalldata: any[] = []
): Promise<DeployResult> => {
  try {
    console.log('Starting contract deployment...');
    console.log('Class hash:', classHash);
    console.log('Constructor calldata:', constructorCalldata);

    // Deploy the contract using Universal Deployer Contract (UDC)
    const deployResponse = await account.deploy({
      classHash,
      constructorCalldata
    });

    console.log('Deploy response:', deployResponse);

    // Wait for transaction confirmation
    const receipt = await account.waitForTransaction(deployResponse.transaction_hash);
    console.log('Deploy receipt:', receipt);

    return {
      contractAddress: Array.isArray(deployResponse.contract_address) 
        ? deployResponse.contract_address[0] 
        : deployResponse.contract_address,
      transactionHash: deployResponse.transaction_hash
    };
  } catch (error: any) {
    console.error('Deploy contract error:', error);
    throw new Error(`Failed to deploy contract: ${error.message || error}`);
  }
};
