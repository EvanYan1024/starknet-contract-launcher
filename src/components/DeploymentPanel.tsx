import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useAccount, useExplorer } from "@starknet-react/core";
import {
  X,
  Rocket,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Contract, DeploymentStep } from "@/types/contract";
import {
  declareContract,
  deployContract,
  convertConstructorArgs,
} from "@/utils/starknet";
import { toast } from "./ui/sonner";

interface DeploymentPanelProps {
  contract: Contract;
  onClose: () => void;
}

const DeploymentPanel = ({ contract, onClose }: DeploymentPanelProps) => {
  const { account } = useAccount();
  const explorer = useExplorer();
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([
    { id: "declare", title: "Declare Contract", status: "pending" },
    { id: "deploy", title: "Deploy Contract", status: "pending" },
  ]);
  const [constructorArgs, setConstructorArgs] = useState<string[]>([]);
  const [classHash, setClassHash] = useState<string>("");
  const [contractAddress, setContractAddress] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  console.log(explorer, "explore");

  // Find constructor in ABI
  const constructor = contract.abi.find(
    (item: any) => item.type === "constructor"
  );
  const constructorInputs = constructor?.inputs || [];

  console.log(constructor, constructorInputs, "con");

  const updateStepStatus = (
    stepId: string,
    status: DeploymentStep["status"],
    description?: string
  ) => {
    setDeploymentSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, status, description } : step
      )
    );
  };

  const handleDeclare = async () => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    updateStepStatus("declare", "loading", "Declaring contract...");

    try {
      const result = await declareContract(
        account,
        contract.sierraData,
        contract.casmData
      );
      setClassHash(result.classHash);
      updateStepStatus(
        "declare",
        "success",
        `Class Hash: ${result.classHash.slice(0, 10)}...`
      );

      toast.success("Contract declared successfully");
    } catch (error: any) {
      console.error("Declare error:", error);
      updateStepStatus(
        "declare",
        "error",
        error.message || "Failed to declare contract"
      );
      toast.error("Failed to declare contract");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeploy = async () => {
    if (!account || !classHash) {
      toast.error("Please declare the contract first");
      return;
    }

    setIsProcessing(true);
    updateStepStatus("deploy", "loading", "Deploying contract...");

    try {
      // Filter out empty arguments
      const filteredArgs = constructorArgs
        .map((arg) => arg.trim())
        .filter((arg) => arg);

      // Convert arguments based on ABI types
      let convertedCalldata: any[] = [];
      if (filteredArgs.length > 0 && constructorInputs.length > 0) {
        convertedCalldata = convertConstructorArgs(
          filteredArgs,
          constructorInputs
        );
        console.log("Original args:", filteredArgs);
        console.log("Converted calldata:", convertedCalldata);
      }

      const result = await deployContract(
        account,
        classHash,
        convertedCalldata
      );
      setContractAddress(result.contractAddress);
      updateStepStatus(
        "deploy",
        "success",
        `Address: ${result.contractAddress.slice(0, 10)}...`
      );

      toast.success("Contract deployed successfully");
    } catch (error: any) {
      console.error("Deploy error:", error);
      updateStepStatus(
        "deploy",
        "error",
        error.message || "Failed to deploy contract"
      );
      toast.error(error.message || "Failed to deploy contract");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConstructorArgChange = (index: number, value: string) => {
    setConstructorArgs((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // Get placeholder text and examples for different Cairo types
  const getInputPlaceholder = (cairoType: string): string => {
    const normalizedType = cairoType.toLowerCase();

    if (normalizedType === "bool") {
      return "true or false";
    }
    if (
      normalizedType.includes("felt") ||
      normalizedType.match(/^u(8|16|32|64|96|128)$/)
    ) {
      return "e.g., 123 or 0x1a2b";
    }
    if (normalizedType === "u256") {
      return "e.g., 123456789 or 0x1a2b3c4d";
    }
    if (
      normalizedType.includes("contractaddress") ||
      normalizedType.includes("ethaddress")
    ) {
      return "e.g., 0x1234...abcd";
    }
    if (
      normalizedType.includes("bytes31") ||
      normalizedType === "shortstring"
    ) {
      return "Short text (max 31 chars)";
    }
    if (
      normalizedType.includes("bytearray") ||
      normalizedType === "longstring"
    ) {
      return "Any length text";
    }
    if (normalizedType.includes("array") || normalizedType.includes("span")) {
      return "e.g., [1,2,3] or 1,2,3";
    }
    return `Enter ${cairoType}`;
  };

  const getInputHelperText = (cairoType: string): string => {
    const normalizedType = cairoType.toLowerCase();

    if (normalizedType === "bool") {
      return "Enter: true, false, 1, or 0";
    }
    if (
      normalizedType.includes("felt") ||
      normalizedType.match(/^u(8|16|32|64|96|128)$/)
    ) {
      return "Numbers in decimal or hex format (0x...)";
    }
    if (normalizedType === "u256") {
      return "Large numbers up to 256 bits";
    }
    if (normalizedType.includes("contractaddress")) {
      return "StarkNet contract address (0x...)";
    }
    if (normalizedType.includes("ethaddress")) {
      return "Ethereum address (0x...)";
    }
    if (
      normalizedType.includes("bytes31") ||
      normalizedType === "shortstring"
    ) {
      return "Text up to 31 ASCII characters";
    }
    if (
      normalizedType.includes("bytearray") ||
      normalizedType === "longstring"
    ) {
      return "Text of any length";
    }
    if (normalizedType.includes("array") || normalizedType.includes("span")) {
      return "Array format: [1,2,3] or comma-separated: 1,2,3";
    }
    return "";
  };

  const getStepIcon = (status: DeploymentStep["status"]) => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-5 h-5 animate-spin text-blue-400" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
        );
    }
  };

  const getStepBadgeVariant = (status: DeploymentStep["status"]) => {
    switch (status) {
      case "loading":
        return "default";
      case "success":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card className="bg-card/80 border-border backdrop-blur-sm h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground flex items-center">
            <Rocket className="w-5 h-5 mr-2 text-purple-400" />
            Deploy {contract.name}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deployment Steps */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Deployment Steps</h3>
          {deploymentSteps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-3">
              <div className="flex flex-col items-center">
                {getStepIcon(step.status)}
                {index < deploymentSteps.length - 1 && (
                  <div className="w-px h-8 bg-border mt-2" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-foreground font-medium">
                    {step.title}
                  </span>
                  <Badge
                    variant={getStepBadgeVariant(step.status)}
                    className="text-xs"
                  >
                    {step.status}
                  </Badge>
                </div>
                {step.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Declare Button */}
        <div className="space-y-2">
          <Button
            onClick={handleDeclare}
            disabled={isProcessing || deploymentSteps[0].status === "success"}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {deploymentSteps[0].status === "loading" && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            <FileText className="w-4 h-4 mr-2" />
            {deploymentSteps[0].status === "success"
              ? "Contract Declared"
              : "Declare Contract"}
          </Button>
        </div>

        {/* Constructor Arguments */}
        {constructorInputs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Constructor Arguments
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                className="text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                Help
              </Button>
            </div>

            {/* Help Section */}
            <Collapsible open={showHelp} onOpenChange={setShowHelp}>
              <CollapsibleContent className="space-y-2">
                <Card className="bg-card/30 border-border">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Data Format Guide
                    </h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        <strong>Numbers:</strong> 123 or 0x1a2b (hex)
                      </div>
                      <div>
                        <strong>Boolean:</strong> true, false, 1, or 0
                      </div>
                      <div>
                        <strong>Addresses:</strong> 0x1234...abcd
                      </div>
                      <div>
                        <strong>Short Text:</strong> Up to 31 characters
                      </div>
                      <div>
                        <strong>Long Text:</strong> Any length text
                      </div>
                      <div>
                        <strong>Arrays:</strong> [1,2,3] or 1,2,3
                      </div>
                      <div>
                        <strong>u256:</strong> Large numbers up to 256 bits
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            <div className="space-y-3 pr-4">
              {constructorInputs.map((input: any, index: number) => {
                console.log(input, index, "cc");
                return (
                  <div key={index} className="space-y-1">
                    <Label className="text-foreground text-sm">
                      {input.name} ({input.type})
                    </Label>
                    <Input
                      value={constructorArgs[index] || ""}
                      onChange={(e) =>
                        handleConstructorArgChange(index, e.target.value)
                      }
                      placeholder={getInputPlaceholder(input.type)}
                      className="bg-input border-border text-foreground"
                    />
                    {getInputHelperText(input.type) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {getInputHelperText(input.type)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Deploy Button */}
        <div className="space-y-2">
          <Button
            onClick={handleDeploy}
            disabled={
              isProcessing ||
              !classHash ||
              deploymentSteps[1].status === "success"
            }
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
          >
            {deploymentSteps[1].status === "loading" && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            <Rocket className="w-4 h-4 mr-2" />
            {deploymentSteps[1].status === "success"
              ? "Contract Deployed"
              : "Deploy Contract"}
          </Button>
        </div>

        {/* Results */}
        {(classHash || contractAddress) && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground">
              Deployment Results
            </h3>
            {classHash && (
              <div>
                <Label className="text-foreground text-sm">Class Hash</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 text-xs font-mono text-muted-foreground bg-card p-2 rounded break-all">
                    {classHash}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(classHash);
                        toast.success("Class hash copied to clipboard");
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const explorerUrl = `${explorer.class(classHash)}`;
                        window.open(explorerUrl, '_blank');
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {contractAddress && (
              <div>
                <Label className="text-foreground text-sm">
                  Contract Address
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 text-xs font-mono text-muted-foreground bg-card p-2 rounded break-all">
                    {contractAddress}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(contractAddress);
                        toast.success("Contract address copied to clipboard");
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const explorerUrl = `${explorer.contract(contractAddress)}`;
                        window.open(explorerUrl, '_blank');
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeploymentPanel;
