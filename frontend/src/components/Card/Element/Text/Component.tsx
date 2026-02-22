import { useState } from "react";
import { FormatBold, FormatItalic, OpenInFull } from "@mui/icons-material";
import { Box } from "@mui/material";
import classNames from "classnames";
import { type Descendant } from "slate";
import { Editable, Slate } from "slate-react";
import Element from "../Element";
import { useElementRegistry } from "../useElementRegistry";
import WidthTooltip from "../WidthTooltip";
import AlignmentTooltip from "./AlignmentTooltip";
import FontSizeTooltip from "./FontSizeTooltip";
import LineHeightTooltip from "./LineHeightTooltip";
import { useSlateControls } from "./useSlateControls";
import VariantTooltip from "./VariantTooltip";

interface TextElementProps {
  /** Unique identifier for the text element */
  id: string;
}

/**
 * TextElement is a rich-text editor component built on Slate.js.
 * It provides a comprehensive floating toolbar for character-level and 
 * block-level formatting, leveraging the useSlateControls hook for 
 * state management and editing logic.
 */
export default function TextElement({ id }: TextElementProps) {
  const element = useElementRegistry((state) => state.getElement(id));
  const updateElement = useElementRegistry((state) => state.updateElement);
  const activeSettingsId = useElementRegistry(
    (state) => state.activeSettingsId,
  );
  const setActiveSettingsId = useElementRegistry(
    (state) => state.setActiveSettingsId,
  );

  const [isFocused, setIsFocused] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [lineHeightOpen, setLineHeightOpen] = useState(false);
  const [alignmentOpen, setAlignmentOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [widthOpen, setWidthOpen] = useState(false);
  const [prevActiveId, setPrevActiveId] = useState(activeSettingsId);

  if (activeSettingsId !== prevActiveId) {
    setPrevActiveId(activeSettingsId);
    if (id !== activeSettingsId) {
      setWidthOpen(false);
      setVariantOpen(false);
      setFontSizeOpen(false);
      setAlignmentOpen(false);
      setLineHeightOpen(false);
    }
  }

  const {
    editor,
    handleValueChange,
    isMarkActive,
    toggleMark,
    getMarkValue,
    setMarkValue,
    getBlockValue,
    setBlockValue,
    renderElement,
    renderLeaf,
    focus,
  } = useSlateControls(
    id,
    (element?.type === "text" ? element.value.value : []) as Descendant[],
    (newValue) => {
      updateElement(id, { value: newValue });
    },
  );

  if (element?.type !== "text") return null;

  const {
    style: { grow },
    value: { variant, expand, width, value: initialValue },
  } = element;

  const currentAlignment = getBlockValue("align") || "left";
  const currentFontSize = getMarkValue("fontSize") || 16;
  const currentLineHeight = getBlockValue("lineHeight") || 120;
  const isBold = isMarkActive("bold");
  const isItalic = isMarkActive("italic");

  return (
    <Slate
      editor={editor}
      initialValue={initialValue as Descendant[]}
      onChange={handleValueChange}
    >
      <Element
        onClick={() => setActiveSettingsId(id)}
        id={id}
        menuProps={{
          settings: [
            {
              children: (
                <AlignmentTooltip
                  alignment={currentAlignment}
                  isOpen={alignmentOpen}
                  onClose={() => setAlignmentOpen(false)}
                  onUpdate={(alignment) => {
                    setBlockValue("align", alignment);
                    focus();
                  }}
                />
              ),
              onMouseDown: (e) => {
                e.preventDefault();
                setAlignmentOpen(true);
              },
              tooltip: "Alignment",
            },
            {
              children: (
                <FontSizeTooltip
                  size={currentFontSize}
                  isOpen={fontSizeOpen}
                  onClose={() => {
                    setFontSizeOpen(false);
                    focus();
                  }}
                  onUpdate={(size) => {
                    setMarkValue("fontSize", size ?? 16);
                  }}
                />
              ),
              onMouseDown: (e) => {
                if ((e.target as HTMLElement).tagName !== "INPUT") {
                  e.preventDefault();
                }
                setFontSizeOpen(true);
              },
              tooltip: "Font Size",
            },
            {
              children: (
                <LineHeightTooltip
                  lineHeight={currentLineHeight}
                  isOpen={lineHeightOpen}
                  onClose={() => {
                    setLineHeightOpen(false);
                    focus();
                  }}
                  onUpdate={(lineHeight) => {
                    setBlockValue("lineHeight", lineHeight);
                  }}
                />
              ),
              onMouseDown: (e) => {
                if ((e.target as HTMLElement).tagName !== "INPUT") {
                  e.preventDefault();
                }
                setLineHeightOpen(true);
              },
              tooltip: "Line Height",
            },
            {
              children: (
                <VariantTooltip
                  variant={variant}
                  isOpen={variantOpen}
                  onClose={() => setVariantOpen(false)}
                  onUpdate={(v) => updateElement<"text">(id, { variant: v })}
                />
              ),
              onMouseDown: (e) => {
                e.preventDefault();
                setVariantOpen(true);
              },
              tooltip: "Variant",
            },
            {
              children: (
                <WidthTooltip
                  width={width}
                  isOpen={widthOpen}
                  onClose={() => setWidthOpen(false)}
                  onUpdate={(val) => updateElement<"text">(id, { width: val })}
                />
              ),
              onMouseDown: (e) => {
                e.preventDefault();
                setWidthOpen(true);
              },
              tooltip: "Width",
            },
            {
              children: <FormatBold />,
              className: classNames({ toggled: isBold }),
              onMouseDown: (e) => {
                e.preventDefault();
                toggleMark("bold");
              },
              tooltip: "Bold",
            },
            {
              children: <FormatItalic />,
              className: classNames({ toggled: isItalic }),
              onMouseDown: (e) => {
                e.preventDefault();
                toggleMark("italic");
              },
              tooltip: "Italic",
            },
            {
              children: <OpenInFull />,
              className: classNames({ toggled: expand }),
              onMouseDown: (e) => {
                e.preventDefault();
                updateElement<"text">(id, { expand: !expand });
              },
              disabled: !grow,
              tooltip: "Expand",
            },
          ],
        }}
      >
        <Box
          sx={(theme) => ({
            padding: theme.spacing(1),
            width: `${width}%`,
            height: expand ? "100%" : undefined,
            boxSizing: "border-box",
            cursor: "text",
            border: "1px solid",
            margin: "1px",
            borderColor: theme.palette.divider,
            borderRadius: theme.shape.borderRadius,
            transition: theme.transitions.create([
              "border-color",
              "box-shadow",
            ]),

            "&:hover": {
              borderColor: theme.palette.text.secondary,
            },

            ...(isFocused && {
              borderColor: theme.palette.primary.main,
              borderWidth: "1px",
              boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
            }),

            "& [data-slate-editor]": {
              outline: "none",
              minHeight: "1em",
              height: expand ? "100%" : undefined,
            },
          })}
        >
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Enter text..."
          />
        </Box>
      </Element>
    </Slate>
  );
}
