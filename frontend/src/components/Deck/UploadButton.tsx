import React, { useRef } from "react";
import { useSnackbar } from "../useSnackbar";
import ControlButton from "./ControlButton";

interface UploadButtonProps<T> {
  /** Callback when JSON data is successfully parsed */
  onUpload: (data: T) => void;
  /** Icon to display inside the button */
  icon: React.ReactNode;
  /** Additional props for the ControlButton */
  [key: string]: unknown;
}

/**
 * UploadButton triggers a file picker for JSON files and passes the parsed data to `onUpload`.
 */
function UploadButton<T>({ onUpload, icon, ...props }: UploadButtonProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const result = e.target?.result;
        if (typeof result === "string") {
          const json = JSON.parse(result) as T;
          onUpload(json);
        }
      } catch (err) {
        console.error("Failed to parse JSON:", err);
        showSnackbar("Invalid JSON file format.", "error");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <>
      <ControlButton
        {...props}
        icon={icon}
        onClick={() => fileInputRef.current?.click()}
      />
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="application/json"
        onChange={handleFileChange}
      />
    </>
  );
}

export default UploadButton;
