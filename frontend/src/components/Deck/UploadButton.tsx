import React, { useRef } from "react";
import { useSnackbar } from "../useSnackbar";
import ControlButton from "./ControlButton";

interface UploadButtonProps<T> {
  /** Callback triggered when the JSON data is successfully parsed */
  onUpload: (data: T) => void;
  /** Icon component or SVG node to display inside the button */
  icon: React.ReactNode;
  /** Pass-through props for the underlying ControlButton */
  [key: string]: unknown;
}

/**
 * UploadButton provides a generic file-import interface.
 * It encapsulates a hidden file input and triggers it when the primary button 
 * is clicked. It handles JSON parsing and basic error reporting.
 */
function UploadButton<T>({ onUpload, icon, ...props }: UploadButtonProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  /**
   * Processes the selected file, reads it as text, and attempts to parse it as JSON.
   */
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
        console.error("JSON Parse Error:", err);
        showSnackbar("Invalid JSON file format.", "error");
      }
    };

    reader.readAsText(file);
    // Reset input value to allow the same file to be uploaded twice consecutively
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
