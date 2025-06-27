import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, File, Trash2, CheckCircle2 } from "lucide-react";
import { Contract } from "@/types/contract";
import { toast } from "sonner";

interface FileUploadProps {
  onContractUpload: (contract: Contract) => void;
  uploadedContracts: Contract[];
  onContractSelect: (contract: Contract) => void;
}

const FileUpload = ({
  onContractUpload,
  uploadedContracts,
  onContractSelect,
}: FileUploadProps) => {
  const [pendingFiles, setPendingFiles] = useState<{ [key: string]: any }>({});

  const processFiles = useCallback((files: File[]) => {
    const newPendingFiles: { [key: string]: any } = {};

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          const baseName = file.name.replace(
            /\.(compiled_contract_class|contract_class)\.json$/,
            ""
          );

          if (!newPendingFiles[baseName]) {
            newPendingFiles[baseName] = {};
          }

          if (file.name.includes("compiled_contract_class.json")) {
            newPendingFiles[baseName].casmData = content;
          } else if (file.name.includes("contract_class.json")) {
            newPendingFiles[baseName].sierraData = content;
            newPendingFiles[baseName].abi = content.abi || [];
          }

          setPendingFiles((prev) => ({ ...prev, ...newPendingFiles }));
        } catch (error) {
          toast.error(`Failed to parse ${file.name}`);
        }
      };
      reader.readAsText(file);
    });
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      processFiles(acceptedFiles);
    },
    [processFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    multiple: true,
  });

  const createContract = (baseName: string) => {
    const files = pendingFiles[baseName];
    if (files.sierraData && files.casmData) {
      const contract: Contract = {
        id: Date.now().toString(),
        name: baseName,
        sierraData: files.sierraData,
        casmData: files.casmData,
        abi: files.abi || [],
      };

      onContractUpload(contract);
      setPendingFiles((prev) => {
        const updated = { ...prev };
        delete updated[baseName];
        return updated;
      });

      toast.success(`Contract ${baseName} ready for deployment`);
    }
  };

  const removePendingFile = (baseName: string) => {
    setPendingFiles((prev) => {
      const updated = { ...prev };
      delete updated[baseName];
      return updated;
    });
  };

  const isContractReady = (baseName: string) => {
    const files = pendingFiles[baseName];
    return files && files.sierraData && files.casmData;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/80 border-border backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center">
            <Upload className="w-5 h-5 mr-2 text-primary" />
            Upload Contract Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/10"
                : "border-border hover:border-border/80 hover:bg-muted/20"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground mb-2">
              {isDragActive
                ? "Drop files here..."
                : "Drag and drop contract files here"}
            </p>
            <p className="text-sm text-muted-foreground">
              Upload both .compiled_contract_class.json and .contract_class.json
              files
            </p>
          </div>
        </CardContent>
      </Card>

      {Object.keys(pendingFiles).length > 0 && (
        <Card className="bg-card/80 border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground text-lg">
              Pending Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(pendingFiles).map(([baseName, files]) => (
              <div
                key={baseName}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-foreground font-medium">{baseName}</p>
                    <div className="flex space-x-2 mt-1">
                      <Badge
                        variant={files.sierraData ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        Sierra {files.sierraData ? "✓" : "✗"}
                      </Badge>
                      <Badge
                        variant={files.casmData ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        CASM {files.casmData ? "✓" : "✗"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {isContractReady(baseName) && (
                    <Button
                      size="sm"
                      onClick={() => createContract(baseName)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removePendingFile(baseName)}
                    className="border-border text-muted-foreground hover:bg-destructive/20 hover:border-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {uploadedContracts.length > 0 && (
        <Card className="bg-card/80 border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground text-lg">
              Ready to Deploy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploadedContracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onContractSelect(contract)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">
                      {contract.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click to deploy
                    </p>
                  </div>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  Ready
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;
