import { Text as SlateText, type Descendant } from "slate";
import { Text as PreviewText } from "../../Preview";
import type { CustomElement } from "./schema";

/**
 * Recursively renders Slate.js nodes into a static React tree for the preview card.
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

interface TextPreviewProps {
  /** The rich-text content rendered by Slate.js */
  value: Descendant[];
  /** The visual style of the text container */
  variant: "banner" | "box";
  /** The width of the element as a percentage of the card */
  width: number;
  /** Whether the element should grow to fill available vertical space */
  expand: boolean;
  /** Unique identifier for the element */
  id: string;
}

/**
 * TextPreview handles the rendering of rich-text content within the card preview.
 */
export default function TextPreview({
  value,
  variant,
  width,
  expand,
}: TextPreviewProps) {
  return (
    <PreviewText variant={variant} width={width} expand={expand}>
      {renderSlateNodes(value)}
    </PreviewText>
  );
}
