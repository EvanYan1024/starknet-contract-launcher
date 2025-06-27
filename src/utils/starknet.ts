
import { AccountInterface, CompiledSierraCasm, CompiledContract, extractContractHashes, hash, CallData, cairo, shortString, byteArray, num } from 'starknet';

export interface DeclareResult {
  classHash: string;
  transactionHash?: string;
}

export interface DeployResult {
  contractAddress: string;
  transactionHash?: string;
}

/**
 * Convert input string to appropriate StarkNet format based on Cairo type
 */
export const convertInputToStarknetFormat = (value: string, cairoType: string): any => {
  if (!value || value.trim() === '') {
    return '0';
  }

  const trimmedValue = value.trim();
  const normalizedType = cairoType.toLowerCase();

  try {
    // Handle boolean types
    if (normalizedType === 'bool') {
      if (trimmedValue.toLowerCase() === 'true' || trimmedValue === '1') {
        return true;
      } else if (trimmedValue.toLowerCase() === 'false' || trimmedValue === '0') {
        return false;
      }
      throw new Error(`Invalid boolean value: ${trimmedValue}`);
    }

    // Handle integer types (felt, u8, u16, u32, u64, u128, u256, etc.)
    if (normalizedType.includes('felt') ||
      normalizedType.match(/^u(8|16|32|64|96|128|256|512)$/) ||
      normalizedType === 'usize' ||
      normalizedType.includes('contractaddress') ||
      normalizedType.includes('ethaddress') ||
      normalizedType.includes('classhash')) {

      // Handle u256 specially
      if (normalizedType === 'u256') {
        return cairo.uint256(trimmedValue);
      }

      // Handle u512 specially
      if (normalizedType === 'u512') {
        return cairo.uint512(trimmedValue);
      }

      // For other integer types, return as BigNumberish
      if (trimmedValue.startsWith('0x')) {
        return trimmedValue;
      } else if (/^\d+$/.test(trimmedValue)) {
        return trimmedValue;
      } else {
        throw new Error(`Invalid number format: ${trimmedValue}`);
      }
    }

    // Handle string types
    if (normalizedType.includes('bytes31') || normalizedType === 'shortstring') {
      // For short strings (31 chars max), encode as shortString
      if (trimmedValue.length > 31) {
        throw new Error(`String too long for shortString/bytes31 (max 31 chars): ${trimmedValue}`);
      }
      return shortString.encodeShortString(trimmedValue);
    }

    // Handle long strings and ByteArray
    if (normalizedType.includes('bytearray') || normalizedType === 'longstring') {
      // For long strings, return as string - StarkNet.js will handle the conversion
      return trimmedValue;
    }

    // Handle arrays - expect JSON format like "[1,2,3]" or comma-separated "1,2,3"
    if (normalizedType.includes('array') || normalizedType.includes('span')) {
      let arrayValues: string[];

      if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
        // JSON array format
        try {
          arrayValues = JSON.parse(trimmedValue);
        } catch {
          throw new Error(`Invalid JSON array format: ${trimmedValue}`);
        }
      } else {
        // Comma-separated format
        arrayValues = trimmedValue.split(',').map(v => v.trim()).filter(v => v);
      }

      // Convert each array element based on the array element type
      const elementType = extractArrayElementType(cairoType);
      return arrayValues.map(val => convertInputToStarknetFormat(val, elementType));
    }

    // For unknown types, try to parse as number first, then return as string
    if (/^\d+$/.test(trimmedValue) || trimmedValue.startsWith('0x')) {
      return trimmedValue;
    }

    // Default: return as string for potential shortString encoding
    return trimmedValue;

  } catch (error) {
    console.error(`Error converting value "${trimmedValue}" for type "${cairoType}":`, error);
    throw new Error(`Failed to convert "${trimmedValue}" to ${cairoType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Extract element type from array type string
 */
const extractArrayElementType = (arrayType: string): string => {
  // Handle patterns like "Array<u32>", "core::array::Array<core::integer::u32>", etc.
  const match = arrayType.match(/Array<(.+?)>|Span<(.+?)>/i);
  if (match) {
    return match[1] || match[2];
  }

  // Default to felt252 for unknown array types
  return 'felt252';
};

/**
 * Convert constructor arguments based on ABI inputs
 */
export const convertConstructorArgs = (args: string[], abiInputs: any[]): any[] => {
  if (args.length !== abiInputs.length) {
    throw new Error(`Argument count mismatch: expected ${abiInputs.length}, got ${args.length}`);
  }

  return args.map((arg, index) => {
    const input = abiInputs[index];
    const cairoType = input.type;

    try {
      return convertInputToStarknetFormat(arg, cairoType);
    } catch (error) {
      throw new Error(`Error converting argument "${input.name}" (${cairoType}): ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
};

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

    // Compile the calldata properly using CallData.compile
    const compiledCalldata = CallData.compile(constructorCalldata);
    console.log('Compiled calldata:', compiledCalldata);

    // Deploy the contract using Universal Deployer Contract (UDC)
    const deployResponse = await account.deploy({
      classHash,
      constructorCalldata: compiledCalldata
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
