import { FormatBold, FormatItalic, OpenInFull } from "@mui/icons-material";
import { Box } from "@mui/material";
import { useCallback, useState } from "react";
import { useElementRegistry } from "../useElementRegistry";
import FontSizeTooltip from "./FontSizeTooltip";
import { getToggleStyles, ICON_STYLES } from "../styles";
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

  const [isFocused, setIsFocused] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [alignmentOpen, setAlignmentOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [widthOpen, setWidthOpen] = useState(false);

  const [editor] = useState(() => withReact(createEditor()));

  const handleChange = useCallback(
    (newValue: Descendant[]) => {
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
      <div {...attributes} style={{ textAlign: element.align || "left" }}>
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

  if (element?.type !== "text") {
    return null;
  }

  const {
    style: { grow },
    value: { value, variant, expand, width },
  } = element;

  const isVisible = isFocused || fontSizeOpen || alignmentOpen || variantOpen;

  const currentAlignment = getBlockValue(editor, "align") || "left";
  const currentFontSize = getMarkValue(editor, "fontSize") || 16;
  const isBold = isMarkActive(editor, "bold");
  const isItalic = isMarkActive(editor, "italic");

  return (
    <Element
      id={id}
      menuProps={{
        visible: isVisible,
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
            onClick: () => {
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
                  setMarkValue(editor, "fontSize", size);
                  ReactEditor.focus(editor);
                }}
              />
            ),
            onClick: () => {
              setFontSizeOpen(true);
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
            onClick: () => {
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
            onClick: () => {
              setWidthOpen(true);
            },
          },
          {
            children: <FormatBold sx={ICON_STYLES} />,
            sx: getToggleStyles(isBold),
            onClick: () => {
              toggleMark(editor, "bold");
              ReactEditor.focus(editor);
            },
          },
          {
            children: <FormatItalic sx={ICON_STYLES} />,
            sx: getToggleStyles(isItalic),
            onClick: () => {
              toggleMark(editor, "italic");
              ReactEditor.focus(editor);
            },
          },
          {
            children: <OpenInFull sx={ICON_STYLES} />,
            sx: getToggleStyles(expand),
            onClick: () => {
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
          width: "100%",
          cursor: "text",
          border: "1px solid",
          margin: "1px",
          borderColor: theme.palette.divider,
          borderRadius: theme.shape.borderRadius,
          transition: theme.transitions.create(["border-color", "box-shadow"]),

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
        <Slate
          editor={editor}
          initialValue={value as Descendant[]}
          onChange={handleChange}
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
        </Slate>
      </Box>
    </Element>
  );
}
