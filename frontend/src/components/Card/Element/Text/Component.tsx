import React, { useCallback, useEffect, useState } from "react";
import { FormatBold, FormatItalic, OpenInFull } from "@mui/icons-material";
import { Box } from "@mui/material";
import classNames from "classnames";
import {
  Editor,
  Element as SlateElement,
  Transforms,
  createEditor,
  type BaseSelection,
  type Descendant,
} from "slate";
import {
  Editable,
  ReactEditor,
  Slate,
  withReact,
  type RenderElementProps,
  type RenderLeafProps,
} from "slate-react";
import Element from "../Element";
import { useElementRegistry } from "../useElementRegistry";
import WidthTooltip from "../WidthTooltip";
import AlignmentTooltip from "./AlignmentTooltip";
import FontSizeTooltip from "./FontSizeTooltip";
import LineHeightTooltip from "./LineHeightTooltip";
import type { CustomElement } from "./schema";
import VariantTooltip from "./VariantTooltip";

interface TextElementProps {
  /** Unique identifier for the text element */
  id: string;
}

interface FormatMap {
  bold: boolean;
  italic: boolean;
  fontSize: number;
}

/**
 * Checks if a specific mark (bold/italic) is active at the current selection.
 */
const isMarkActive = (editor: Editor, format: keyof FormatMap) => {
  const marks = Editor.marks(editor);
  return marks ? (marks as unknown as FormatMap)[format] === true : false;
};

/**
 * Toggles a mark (bold/italic) for the current selection.
 */
const toggleMark = (editor: Editor, format: "bold" | "italic") => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

/**
 * Gets the value of a mark (like fontSize) at the current selection.
 */
const getMarkValue = <F extends keyof FormatMap>(editor: Editor, format: F) => {
  const marks = Editor.marks(editor);
  return marks ? (marks as unknown as FormatMap)[format] : undefined;
};

/**
 * Sets a specific mark value (like fontSize) for the current selection.
 */
const setMarkValue = <F extends keyof FormatMap>(
  editor: Editor,
  format: F,
  value: FormatMap[F],
) => {
  // Restore selection if it was lost during toolbar interaction
  if (!editor.selection && (editor as unknown as { lastSelection: BaseSelection }).lastSelection) {
    Transforms.select(editor, (editor as unknown as { lastSelection: BaseSelection }).lastSelection);
  }

  Editor.addMark(editor, format, value);
};

type BlockMap = {
  align: CustomElement["align"];
  lineHeight: CustomElement["lineHeight"];
};

/**
 * Gets the value of a block-level property (align/lineHeight) for the current selection.
 */
const getBlockValue = <F extends keyof BlockMap>(editor: Editor, format: F) => {
  const { selection } = editor;
  if (!selection) return undefined;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && format in n,
    }),
  );

  return match ? (match[0] as CustomElement)[format] : undefined;
};

/**
 * Sets a block-level property (align/lineHeight) for the selected blocks.
 */
const setBlockValue = <F extends keyof BlockMap>(
  editor: Editor,
  format: F,
  value: BlockMap[F],
) => {
  Transforms.setNodes(
    editor,
    { [format]: value },
    { match: (n) => SlateElement.isElement(n) },
  );
};

/**
 * TextElement is a sophisticated rich-text editor built on Slate.js.
 * It provides a comprehensive floating toolbar for character-level (font size, bold, italic)
 * and block-level (alignment, line height) formatting, plus card-specific layout options.
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
  const [, setSelectionTick] = useState(0);
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

  const [editor] = useState(() => withReact(createEditor()));

  /**
   * Synchronizes internal Slate state with the global ElementRegistry.
   */
  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      setSelectionTick((s) => s + 1);

      const isAstChange = editor.operations.some(
        (op) => op.type !== "set_selection",
      );

      if (isAstChange) {
        updateElement(id, { value: newValue });
      }
    },
    [id, updateElement, editor],
  );

  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;
    return (
      <div
        {...attributes}
        style={{
          textAlign: element.align || "left",
          lineHeight: element.lineHeight ? `${element.lineHeight}%` : undefined,
        }}
      >
        {children}
      </div>
    );
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    const { attributes, children, leaf } = props;
    const style: React.CSSProperties = {
      fontWeight: leaf.bold ? "bold" : "normal",
      fontStyle: leaf.italic ? "italic" : "normal",
      fontSize: leaf.fontSize ? `${leaf.fontSize}px` : undefined,
    };

    return (
      <span {...attributes} style={style}>
        {children}
      </span>
    );
  }, []);

  /**
   * Effect to update Slate's internal content if the global state changes externally 
   * (e.g., when loading a new card).
   */
  useEffect(() => {
    if (element?.type !== "text") return;

    const isDifferent =
      JSON.stringify(editor.children) !== JSON.stringify(element.value.value);

    if (isDifferent) {
      Editor.withoutNormalizing(editor, () => {
        editor.children.forEach(() =>
          Transforms.removeNodes(editor, { at: [0] }),
        );
        Transforms.insertNodes(editor, element.value.value as Descendant[], {
          at: [0],
        });
      });
    }
  }, [element, editor]);

  if (element?.type !== "text") return null;

  const {
    style: { grow },
    value: { variant, expand, width },
  } = element;

  const currentAlignment = getBlockValue(editor, "align") || "left";
  const currentFontSize = getMarkValue(editor, "fontSize") || 16;
  const currentLineHeight = getBlockValue(editor, "lineHeight") || 120;
  const isBold = isMarkActive(editor, "bold");
  const isItalic = isMarkActive(editor, "italic");

  return (
    <Slate
      editor={editor}
      initialValue={element.value.value as Descendant[]}
      onChange={handleChange}
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
                    setBlockValue(editor, "align", alignment);
                    ReactEditor.focus(editor);
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
                    ReactEditor.focus(editor);
                  }}
                  onUpdate={(size) => {
                    setMarkValue(editor, "fontSize", size ?? 16);
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
                    ReactEditor.focus(editor);
                  }}
                  onUpdate={(lineHeight) => {
                    setBlockValue(editor, "lineHeight", lineHeight);
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
                toggleMark(editor, "bold");
              },
              tooltip: "Bold",
            },
            {
              children: <FormatItalic />,
              className: classNames({ toggled: isItalic }),
              onMouseDown: (e) => {
                e.preventDefault();
                toggleMark(editor, "italic");
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
