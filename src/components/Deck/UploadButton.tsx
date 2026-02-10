import React, { useRef } from "react";
import { useSnackbar } from "../useSnackbar";
import ControlButton from "./ControlButton";

// Define the props interface
interface UploadButtonProps<T> {
  onUpload: (data: T) => void;
  icon: React.ReactNode;
  // Allows for extra ControlButton props like 'title' or 'className'
  [key: string]: unknown;
}

/**
 * A reusable component that triggers a file upload via a hidden input.
 * @template T The expected type of the JSON data.
 */
function UploadButton<T>({ onUpload, icon, ...props }: UploadButtonProps<T>) {
  // Explicitly type the ref for an HTMLInputElement
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

    // Reset the input value so the same file can be re-uploaded if modified
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
