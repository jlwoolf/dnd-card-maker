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

    // 1. Find all images within the ref
    const images = elementRef.current.querySelectorAll("img");
    const originalSrcs = new Map<HTMLImageElement, string>();

    try {
      // 2. Convert all images to DataURLs and store originals
      const conversionPromises = Array.from(images).map(async (img) => {
        originalSrcs.set(img, img.src);
        const proxyUrl = "https://cors-anywhere.com/";
        const dataUrl = await toDataUrl(proxyUrl + img.src);
        img.src = dataUrl;
      });

      await Promise.all(conversionPromises);

      // 3. Perform the capture
      const dataUrl = await toPng(elementRef.current, {
        cacheBust: true,
        // Ensure fonts/styles are included
        skipFonts: false,
      });

      return dataUrl;
    } catch (err) {
      console.error("Oops, something went wrong!", err);
      showSnackbar("Failed to generate image preview", "error");
      return;
    } finally {
      // 4. Cleanup: Revert images back to original URLs
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
    <Box width="20%" position="relative" minWidth="400px">
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
          bottom: 0,
          right: -32,
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
