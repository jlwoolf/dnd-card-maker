import { Save, Add } from "@mui/icons-material";
import { Button } from "@mui/material";
import RoundedButtonGroup from "./RoundedButtonGroup";
import useExportCards from "../useExportCards";
import { toPng } from "html-to-image";
import { useCallback } from "react";
import { useSnackbar } from "../useSnackbar";
import { usePreviewTheme } from "./Preview";
import { useElementRegistry } from "./Element/useElementRegistry";
import { useSharedElement } from "./ElementRefContext";

async function toDataUrl(url: string): Promise<string> {
  // Check if it's already a data URL to avoid re-fetching
  if (url.startsWith("data:")) return url;

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to convert image to DataURL", err);
    return url; // Fallback to original URL
  }
}

export default function CardButtons() {
  const { element } = useSharedElement();
  const { elements, cardId } = useElementRegistry();
  const previewTheme = usePreviewTheme();
  const validCard = useExportCards(
    (state) => !!state.cards.find((card) => card.id === cardId),
  );
  const { addCard, updateCard } = useExportCards();
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  const getImageUrl = useCallback(async () => {
    if (element === null) return;

    // Find all images within the ref
    const images = element.querySelectorAll("img");
    const originalSrcs = new Map<HTMLImageElement, string>();

    try {
      // Convert ALL images (Remote AND Blobs) to DataURLs
      const conversionPromises = Array.from(images).map(async (img) => {
        // Store original src for cleanup
        originalSrcs.set(img, img.src);

        // Skip processing if it's already a data URL
        if (img.src.startsWith("data:")) return;

        let urlToFetch = img.src;

        // ONLY apply the proxy if it is a remote web URL.
        // Do NOT apply proxy to "blob:" urls.
        if (img.src.startsWith("http") || img.src.startsWith("https")) {
          const proxyUrl = "https://cors-anywhere.com/";
          urlToFetch = proxyUrl + img.src;
        }

        // fetch() works on blob: URLs natively, converting them to blobs,
        // which FileReader then converts to base64.
        const dataUrl = await toDataUrl(urlToFetch);
        img.src = dataUrl;
      });

      await Promise.all(conversionPromises);

      // Perform the capture
      const dataUrl = await toPng(element, {
        cacheBust: true,
        skipFonts: false,
      });

      return dataUrl;
    } catch (err) {
      console.error("Oops, something went wrong!", err);
      showSnackbar("Failed to generate image preview", "error");
      return;
    } finally {
      // Cleanup: Revert images back to original URLs (blobs or http links)
      originalSrcs.forEach((src, img) => {
        img.src = src;
      });
    }
  }, [element, showSnackbar]);

  const handleSave = useCallback(async () => {
    if (cardId) {
      const dataUrl = await getImageUrl();
      if (dataUrl) {
        updateCard(cardId, { elements, imgUrl: dataUrl, theme: previewTheme });
        showSnackbar("Card saved successfully!", "success");
      }
    }
  }, [cardId, getImageUrl, updateCard, elements, previewTheme, showSnackbar]);

  const handleAdd = useCallback(async () => {
    const dataUrl = await getImageUrl();
    if (dataUrl) {
      addCard(elements, dataUrl, previewTheme);
      showSnackbar("Card added to deck!", "success");
    }
  }, [addCard, elements, getImageUrl, previewTheme, showSnackbar]);

  return (
    <RoundedButtonGroup
      sx={{
        position: "fixed",
        bottom: "20px",
        right: { md: "50%", xs: "20px" },
        transform: { md: "translate(50%)" },
        zIndex: 10,
      }}
    >
      {validCard && (
        <Button onClick={handleSave}>
          <Save />
        </Button>
      )}
      <Button onClick={handleAdd}>
        <Add />
      </Button>
    </RoundedButtonGroup>
  );
}
