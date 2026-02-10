import { Box, Button, Typography } from "@mui/material";
import { useElementRegistry } from "../Element/useElementRegistry";
import Background from "./Background";
import Text from "./Text";
import Image from "./Image";
import { Add, Save } from "@mui/icons-material";
import { useCallback, useRef } from "react";
import { toPng } from "html-to-image";
import useExportCards from "@src/components/useExportCards";
import RoundedButtonGroup from "../RoundedButtonGroup";
import { useSnackbar } from "@src/components/useSnackbar";
import { usePreviewTheme } from "./usePreviewTheme";

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

export default function PreviewCard() {
  const previewTheme = usePreviewTheme();
  const { elements, cardId } = useElementRegistry();
  const validCard = useExportCards(
    (state) => !!state.cards.find((card) => card.id === cardId),
  );
  const { addCard, updateCard } = useExportCards();
  const elementRef = useRef<HTMLDivElement>(null);
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  const getImageUrl = useCallback(async () => {
    if (elementRef.current === null) return;

    // Find all images within the ref
    const images = elementRef.current.querySelectorAll("img");
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
      const dataUrl = await toPng(elementRef.current, {
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
  }, [showSnackbar]);

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
    <Box
      width="20%"
      position="relative"
      minWidth="400px"
      sx={() => ({
        scale: { xs: 0.8, md: 1.0 },
        transformOrigin: "center center",
        top: { xs: -40, md: 0 },
      })}
    >
      <Background ref={elementRef}>
        {elements
          .map((element) => {
            switch (element.type) {
              case "text": {
                const {
                  value,
                  bold,
                  italic,
                  size,
                  alignment,
                  variant,
                  width,
                  expand,
                } = element.value;
                const values = value.split("\n");
                const typography = values.map((v, index) => (
                  <Typography
                    key={index}
                    component="p"
                    whiteSpace="pre-line"
                    lineHeight={"1.2"}
                    fontSize={size}
                    textAlign={alignment}
                    fontWeight={bold ? "bold" : "normal"}
                    fontStyle={italic ? "italic" : "normal"}
                    sx={{
                      wordBreak: "break-word",
                      marginBottom:
                        index < values.length - 1 ? "0.5em" : undefined,
                    }}
                  >
                    {v ? v : <>&nbsp;</>}
                  </Typography>
                ));
                return [
                  element,
                  <Text variant={variant} width={width} expand={expand}>
                    {typography}
                  </Text>,
                ] as const;
              }

              case "image": {
                const { src, radius, width } = element.value;
                return [
                  element,
                  <Image radius={radius} width={width}>
                    <Box
                      component="img"
                      src={src || "https://placehold.co/600x400"}
                      sx={{
                        width: `100%`,
                        display: "block",
                        objectFit: "cover",
                        transition: "all 0.2s ease-in-out",
                      }}
                    />
                  </Image>,
                ] as const;
              }

              default:
                return [];
            }
          })
          .map(([element, children]) => (
            <Box
              width="100%"
              flexGrow={element.style.grow ? 1 : 0}
              alignContent={element.style.align}
              key={element.id}
            >
              {children}
            </Box>
          ))}
      </Background>
      <RoundedButtonGroup
        sx={{
          position: "absolute",
          bottom: { xs: -(57.6 / 2 / 0.8), md: -(57.6 / 2) },
          right: {
            xs: `calc(50% - ${validCard ? 57.6 / 0.8 : 57.6 / 2 / 0.8}px)`,
            md: -(57.6 / 2),
          },
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
    </Box>
  );
}
