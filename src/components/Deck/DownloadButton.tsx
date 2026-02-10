import { Download } from "@mui/icons-material";
import ControlButton from "./ControlButton";
import useExportCards from "../useExportCards";
import { useSnackbar } from "../useSnackbar";

export default function DownloadButton() {
  const cards = useExportCards((state) => state.cards);
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  return (
    <ControlButton
      icon={<Download />}
      onClick={() => {
        const jsonString = JSON.stringify(cards, null, 2);

        const blob = new Blob([jsonString], {
          type: "application/json",
        });

        const href = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = href;
        link.download = "cards_data.json"; // Name of the file

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
        showSnackbar("Deck exported to JSON", "success");
      }}
    />
  );
}
