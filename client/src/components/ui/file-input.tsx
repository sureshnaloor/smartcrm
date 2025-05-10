import { ChangeEvent, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface FileInputProps {
  accept?: string;
  maxSize?: number;
  onChange: (file: File | null) => void;
  className?: string;
  buttonText?: string;
  helperText?: string;
  errorText?: string;
}

export function FileInput({
  accept = "*",
  maxSize = 5 * 1024 * 1024, // 5MB
  onChange,
  className,
  buttonText = "Choose file",
  helperText,
  errorText,
}: FileInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    setError(null);

    if (!file) {
      setSelectedFile(null);
      onChange(null);
      return;
    }

    // Check file size
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
      setSelectedFile(null);
      onChange(null);
      return;
    }

    setSelectedFile(file);
    onChange(file);
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center w-full p-6 border-2 border-dashed rounded-md",
          selectedFile
            ? "border-primary/50 bg-primary/5"
            : "border-gray-300 bg-gray-50",
          "hover:bg-gray-100 cursor-pointer transition-colors"
        )}
        onClick={handleClick}
      >
        <div className="space-y-2 text-center">
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <div className="flex flex-col items-center text-sm">
            <span className="font-medium text-primary">{buttonText}</span>
            {selectedFile ? (
              <span className="text-gray-600">{selectedFile.name}</span>
            ) : (
              <span className="text-gray-500">
                {helperText || `Drag and drop or click to select a file`}
              </span>
            )}
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      {(error || errorText) && (
        <p className="text-sm text-destructive">{error || errorText}</p>
      )}
    </div>
  );
}
