import React, { useCallback, useEffect, useState } from "react";
import {
  Editor,
  Element as SlateElement,
  Transforms,
  createEditor,
  type BaseSelection,
  type Descendant,
} from "slate";
import {
  ReactEditor,
  withReact,
  type RenderElementProps,
  type RenderLeafProps,
} from "slate-react";
import { type CustomElement } from "@src/schemas";

interface FormatMap {
  bold: boolean;
  italic: boolean;
  fontSize: number;
}

type BlockMap = {
  align: CustomElement["align"];
  lineHeight: CustomElement["lineHeight"];
};

/**
 * useSlateControls encapsulates all Slate.js specific logic, including editor
 * initialization, formatting helpers, and synchronization logic.
 * This decouples rich-text editing mechanics from the UI components.
 */
export function useSlateControls(
  _id: string,
  initialValue: Descendant[],
  onUpdate: (value: Descendant[]) => void,
) {
  const [editor] = useState(() => withReact(createEditor()));
  const [, setSelectionTick] = useState(0);

  /**
   * Synchronizes Slate state with external updates.
   */
  const handleValueChange = useCallback(
    (newValue: Descendant[]) => {
      setSelectionTick((s) => s + 1);

      const isAstChange = editor.operations.some(
        (op) => op.type !== "set_selection",
      );

      if (isAstChange) {
        onUpdate(newValue);
      }
    },
    [editor, onUpdate],
  );

  /**
   * Character-level formatting (marks)
   */
  const isMarkActive = useCallback(
    (format: keyof FormatMap) => {
      const marks = Editor.marks(editor);
      return marks ? (marks as unknown as FormatMap)[format] === true : false;
    },
    [editor],
  );

  const toggleMark = useCallback(
    (format: "bold" | "italic") => {
      const isActive = isMarkActive(format);
      if (isActive) {
        Editor.removeMark(editor, format);
      } else {
        Editor.addMark(editor, format, true);
      }
    },
    [editor, isMarkActive],
  );

  const getMarkValue = useCallback(
    <F extends keyof FormatMap>(format: F) => {
      const marks = Editor.marks(editor);
      return marks ? (marks as unknown as FormatMap)[format] : undefined;
    },
    [editor],
  );

  const setMarkValue = useCallback(
    <F extends keyof FormatMap>(format: F, value: FormatMap[F]) => {
      if (!editor.selection && editor.lastSelection) {
        Transforms.select(editor, editor.lastSelection);
      }
      Editor.addMark(editor, format, value);
    },
    [editor],
  );

  /**
   * Block-level formatting
   */
  const getBlockValue = useCallback(
    <F extends keyof BlockMap>(format: F) => {
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
    },
    [editor],
  );

  const setBlockValue = useCallback(
    <F extends keyof BlockMap>(format: F, value: BlockMap[F]) => {
      Transforms.setNodes(
        editor,
        { [format]: value },
        { match: (n) => SlateElement.isElement(n) },
      );
    },
    [editor],
  );

  /**
   * Renderer helpers
   */
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
   * External state sync effect
   */
  useEffect(() => {
    const isDifferent =
      JSON.stringify(editor.children) !== JSON.stringify(initialValue);

    if (isDifferent) {
      Editor.withoutNormalizing(editor, () => {
        editor.children.forEach(() =>
          Transforms.removeNodes(editor, { at: [0] }),
        );
        Transforms.insertNodes(editor, initialValue, {
          at: [0],
        });
      });
    }
  }, [initialValue, editor]);

  return {
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
    focus: () => ReactEditor.focus(editor),
  };
}

declare module "slate" {
  export interface BaseEditor {
    lastSelection: BaseSelection | null;
  }
}
