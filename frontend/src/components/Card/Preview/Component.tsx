import { Box } from "@mui/material";
import { Text as SlateText, type Descendant } from "slate";
import type { CustomElement } from "../Element/Text/schema";
import { useElementRegistry } from "../Element/useElementRegistry";
import { useSharedElement } from "../ElementRefContext";
import Background from "./Background";
import Image from "./Image";
import Text from "./Text";

/**
 * Recursively renders Slate.js nodes into a static React tree for the preview card.
 * This function translates Slate's JSON-based AST into styled spans and divs.
 * 
 * @param nodes - Array of Slate Descendant nodes.
 * @returns A React node tree.
 */
const renderSlateNodes = (nodes: Descendant[]) => {
  return nodes.map((node, index) => {
    if (SlateText.isText(node)) {
      return (
        <span
          key={index}
          style={{
            fontWeight: node.bold ? "bold" : "normal",
            fontStyle: node.italic ? "italic" : "normal",
            fontSize: node.fontSize ? `${node.fontSize}px` : undefined,
            whiteSpace: "pre-wrap",
          }}
        >
          {node.text}
        </span>
      );
    }

    return (
      <div
        key={index}
        style={{
          textAlign: (node as CustomElement).align || "left",
          lineHeight: (node as CustomElement).lineHeight
            ? `${(node as CustomElement).lineHeight}%`
            : undefined,
          minHeight: "1em",
        }}
      >
        {renderSlateNodes(node.children)}
      </div>
    );
  });
};

/**
 * PreviewCard renders a read-only, high-fidelity visual representation of 
 * the card being edited. It is designed to be captured as an image for export.
 */
export default function PreviewCard() {
  const { elements } = useElementRegistry();
  const { setElement } = useSharedElement();

  return (
    <Box width="20%" position="relative" minWidth="400px">
      <Background ref={setElement}>
        {elements.map((element) => {
          let children: React.ReactNode = null;

          if (element.type === "text") {
            const { value, variant, width, expand } = element.value;
            children = (
              <Text variant={variant} width={width} expand={expand}>
                {renderSlateNodes(value as Descendant[])}
              </Text>
            );
          } else if (element.type === "image") {
            const { src, radius, width } = element.value;
            children = (
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
              </Image>
            );
          }

          return (
            <Box
              key={element.id}
              width="100%"
              flexGrow={element.style.grow ? 1 : 0}
              alignContent={element.style.align}
            >
              {children}
            </Box>
          );
        })}
      </Background>
    </Box>
  );
}
