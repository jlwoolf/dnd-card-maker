import { FormatBold, FormatItalic, OpenInFull } from "@mui/icons-material";
import { Box } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useElementRegistry } from "../useElementRegistry";
import FontSizeTooltip from "./FontSizeTooltip";
import LineHeightTooltip from "./LineHeightTooltip";
import AlignmentTooltip from "./AlignmentTooltip";
import Element from "../Element";
import VariantTooltip from "./VariantTooltip";
import WidthTooltip from "../WidthTooltip";
import {
  createEditor,
  Editor,
  Element as SlateElement,
  Transforms,
  type Descendant,
} from "slate";
import {
  Slate,
  Editable,
  withReact,
  type RenderLeafProps,
  type RenderElementProps,
  ReactEditor,
} from "slate-react";
import type { CustomElement } from "./schema";
import classNames from "classnames";

interface TextElementProps {
  id: string;
}

interface FormatMap {
  bold: boolean;
  italic: boolean;
  fontSize: number;
}

const isMarkActive = (editor: Editor, format: keyof FormatMap) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleMark = (editor: Editor, format: "bold" | "italic") => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const getMarkValue = <F extends keyof FormatMap>(editor: Editor, format: F) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] : undefined;
};

const setMarkValue = <F extends keyof FormatMap>(
  editor: Editor,
  format: F,
  value: FormatMap[F],
) => {
  Editor.addMark(editor, format, value);
};

type BlockMap = {
  align: CustomElement["align"];
  lineHeight: CustomElement["lineHeight"];
};

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

  const [editor] = useState(() => withReact(createEditor()));

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

  useEffect(() => {
    if (element?.type !== "text") {
      return;
    }

    // 1. Check if the editor's current content is different from the store's value
    // We stringify for a simple deep-equality check
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

  useEffect(() => {
    if (id !== activeSettingsId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWidthOpen(false);
      setVariantOpen(false);
      setFontSizeOpen(false);
      setAlignmentOpen(false);
      setLineHeightOpen(false);
    }
  }, [id, activeSettingsId]);

  if (element?.type !== "text") {
    return null;
  }

  const {
    style: { grow },
    value: { value, variant, expand, width },
  } = element;

  const currentAlignment = getBlockValue(editor, "align") || "left";
  const currentFontSize = getMarkValue(editor, "fontSize") || 16;
  const currentLineHeight = getBlockValue(editor, "lineHeight") || 120;
  const isBold = isMarkActive(editor, "bold");
  const isItalic = isMarkActive(editor, "italic");

  return (
    <Slate
      editor={editor}
      initialValue={value as Descendant[]}
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
            },
            {
              children: (
                <FontSizeTooltip
                  size={currentFontSize}
                  isOpen={fontSizeOpen}
                  onClose={() => setFontSizeOpen(false)}
                  onUpdate={(size) => {
                    setMarkValue(editor, "fontSize", size ?? 16);
                  }}
                />
              ),
              onMouseDown: (e) => {
                e.preventDefault();
                setFontSizeOpen(true);
              },
            },
            {
              children: (
                <LineHeightTooltip
                  lineHeight={currentLineHeight}
                  isOpen={lineHeightOpen}
                  onClose={() => setLineHeightOpen(false)}
                  onUpdate={(lineHeight) => {
                    setBlockValue(editor, "lineHeight", lineHeight);
                  }}
                />
              ),
              onMouseDown: (e) => {
                e.preventDefault();
                setLineHeightOpen(true);
              },
            },
            {
              children: (
                <VariantTooltip
                  variant={variant}
                  isOpen={variantOpen}
                  onClose={() => setVariantOpen(false)}
                  onUpdate={(variant) => updateElement<"text">(id, { variant })}
                />
              ),
              onMouseDown: (e) => {
                e.preventDefault();
                setVariantOpen(true);
              },
            },
            {
              children: (
                <WidthTooltip
                  width={width}
                  isOpen={!!widthOpen}
                  onClose={() => setWidthOpen(false)}
                  onUpdate={(val) => updateElement<"text">(id, { width: val })}
                />
              ),
              onMouseDown: (e) => {
                e.preventDefault();
                setWidthOpen(true);
              },
            },
            {
              children: <FormatBold />,
              className: classNames({ toggled: isBold }),
              onMouseDown: (e: React.MouseEvent) => {
                e.preventDefault();
                toggleMark(editor, "bold");
              },
            },
            {
              children: <FormatItalic />,
              className: classNames({ toggled: isItalic }),
              onMouseDown: (e: React.MouseEvent) => {
                e.preventDefault();
                toggleMark(editor, "italic");
              },
            },
            {
              children: <OpenInFull />,
              className: classNames({ toggled: expand }),
              onMouseDown: (e: React.MouseEvent) => {
                e.preventDefault();
                updateElement<"text">(id, { expand: !expand });
              },
              disabled: !grow,
            },
          ],
        }}
      >
        <Box
          sx={(theme) => ({
            padding: theme.spacing(1),
            width: `${width}%`,
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
            },
          })}
        >
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onFocus={() => {
              setIsFocused(true);
            }}
            onBlur={() => {
              setIsFocused(false);
            }}
            placeholder="Enter text..."
          />
        </Box>
      </Element>
    </Slate>
  );
}
