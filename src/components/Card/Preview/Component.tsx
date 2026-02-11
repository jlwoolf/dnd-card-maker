import { Box } from "@mui/material";
import { useElementRegistry } from "../Element/useElementRegistry";
import Background from "./Background";
import Text from "./Text";
import Image from "./Image";
import { useSharedElement } from "../ElementRefContext";
import { Text as SlateText, type Descendant } from "slate";
import type { CustomElement } from "../Element/Text/schema";

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

export default function PreviewCard() {
  const { elements } = useElementRegistry();
  const { setElement } = useSharedElement();

  return (
    <Box width="20%" position="relative" minWidth="400px">
      <Background ref={setElement}>
        {elements
          .map((element) => {
            switch (element.type) {
              case "text": {
                const { value, variant, width, expand } = element.value;
                return [
                  element,
                  <Text variant={variant} width={width} expand={expand}>
                    {renderSlateNodes(value as Descendant[])}
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
    </Box>
  );
}
