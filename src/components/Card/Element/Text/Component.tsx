import { FormatBold, FormatItalic, OpenInFull } from "@mui/icons-material";
import { TextField } from "@mui/material";
import { useState } from "react";
import { useElementRegistry } from "../useElementRegistry";
import FontSizeTooltip from "./FontSizeTooltip";
import { getToggleStyles, ICON_STYLES } from "../styles";
import AlignmentTooltip from "./AlignmentTooltip";
import Element from "../Element";
import VariantTooltip from "./VariantTooltip";
import WidthTooltip from "../WidthTooltip";

interface TextElementProps {
  id: string;
}

export default function TextElement({ id }: TextElementProps) {
  const element = useElementRegistry((state) => state.getElement(id));
  const updateElement = useElementRegistry((state) => state.updateElement);

  const [isFocused, setIsFocused] = useState(false);

  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [alignmentOpen, setAlignmentOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [widthOpen, setWidthOpen] = useState(false);

  if (element?.type !== "text") {
    return;
  }

  const {
    style: { grow },
    value: { value, size, bold, italic, alignment, variant, expand, width },
  } = element;

  const isVisible = isFocused || fontSizeOpen || alignmentOpen || variantOpen;

  return (
    <Element
      id={id}
      menuProps={{
        visible: isVisible,
        settings: [
          {
            children: (
              <AlignmentTooltip
                alignment={alignment}
                isOpen={alignmentOpen}
                onClose={() => setAlignmentOpen(false)}
                onUpdate={(alignment) =>
                  updateElement<"text">(id, { alignment })
                }
              />
            ),
            onClick: () => setAlignmentOpen(true),
          },
          {
            children: (
              <FontSizeTooltip
                size={size}
                isOpen={fontSizeOpen}
                onClose={() => setFontSizeOpen(false)}
                onUpdate={(size) => updateElement<"text">(id, { size })}
              />
            ),
            onClick: () => setFontSizeOpen(true),
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
            onClick: () => setVariantOpen(true),
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
            onClick: () => setWidthOpen(true),
          },
          {
            children: <FormatBold sx={ICON_STYLES} />,
            sx: getToggleStyles(bold),
            onClick: () => updateElement<"text">(id, { bold: !bold }),
          },
          {
            children: <FormatItalic sx={ICON_STYLES} />,
            sx: getToggleStyles(italic),
            onClick: () => updateElement<"text">(id, { italic: !italic }),
          },
          {
            children: <OpenInFull sx={ICON_STYLES} />,
            sx: getToggleStyles(expand),
            onClick: () => updateElement<"text">(id, { expand: !expand }),
            disabled: !grow
          },
        ],
      }}
    >
      <TextField
        fullWidth
        multiline
        value={value}
        slotProps={{}}
        onChange={(e) => updateElement<"text">(id, { value: e.target.value })}
        sx={(theme) => ({
          "& .MuiInputBase-input": {
            lineHeight: "1em",
            textAlign: alignment,
            fontSize: `${size}px`,
            fontWeight: bold ? "bold" : "normal",
            fontStyle: italic ? "italic" : "normal",
          },
          "& .MuiInputBase-root": {
            padding: theme.spacing(1),
          },
        })}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </Element>
  );
}
