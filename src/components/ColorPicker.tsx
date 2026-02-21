import { useMemo, useEffect, forwardRef } from "react";
import { MuiColorInput, type MuiColorInputProps } from "mui-color-input";
import {
  Box,
  ButtonBase,
  Typography,
  CircularProgress,
  PopoverPaper,
  type PaperProps,
} from "@mui/material";
import { useCardPalettes } from "./useCardPalettes"; // Adjust path as needed

// Define a custom Paper component to wrap the default popover content
const CustomPaper = forwardRef<
  HTMLDivElement,
  PaperProps & {
    colors: string[];
    onColorSelect: (color: string) => void;
    isGenerating: boolean;
  }
>(({ colors, onColorSelect, isGenerating, children, ...rest }, ref) => (
  <PopoverPaper
    {...rest}
    ref={ref}
    sx={{
      ...rest.sx,
    }}
  >
    {/* Default Color Picker UI */}
    {children}

    {/* Our Custom Palette Footer */}
    <Box
      p={1.5}
      borderTop="1px solid"
      borderColor="divider"
      bgcolor="background.default"
      width="300px"
    >
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        mb={1}
      >
        {isGenerating ? "Analyzing cards..." : "Document Colors"}
      </Typography>

      <Box display="flex" flexWrap="wrap" gap={0.55}>
        {isGenerating && colors.length === 0 ? (
          <CircularProgress size={16} />
        ) : colors.length > 0 ? (
          colors.map((color) => (
            <ButtonBase
              key={color}
              onClick={() => onColorSelect(color)}
              sx={{
                width: 26,
                height: 26,
                backgroundColor: color,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                transition: "transform 0.1s",
                "&:hover": { transform: "scale(1.1)" },
              }}
              title={color}
            />
          ))
        ) : (
          <Typography variant="caption" color="text.disabled">
            No colors found.
          </Typography>
        )}
      </Box>
    </Box>
  </PopoverPaper>
));

export function ColorPicker({
  value,
  onChange,
  PopoverProps,
  slotProps,
  ...rest
}: Omit<MuiColorInputProps, "onChange"> & {
  onChange: (color: string) => void;
}) {
  // 2. Consume the hook
  const { palettes, isGenerating, generateAllPalettes } = useCardPalettes(5);

  // 3. Trigger generation when the picker mounts
  useEffect(() => {
    generateAllPalettes();
  }, [generateAllPalettes]);

  // 4. Flatten all card palettes into a single array of unique colors
  const documentColors = useMemo(() => {
    const uniqueColors = new Set<string>();
    Object.values(palettes).forEach((palette) => {
      palette.forEach((color) => uniqueColors.add(color));
    });
    return Array.from(uniqueColors);
  }, [palettes]);

  return (
    <MuiColorInput
      {...rest}
      fullWidth
      format="hex"
      value={value}
      onChange={onChange}
      slotProps={{
        input: {
          sx: { paddingLeft: 1 },
        },
        htmlInput: {
          sx: { padding: 1 },
        },
        ...slotProps,
      }}
      PopoverProps={{
        slots: {
          ...PopoverProps,
          paper: (paperProps) => (
            <CustomPaper
              {...paperProps}
              colors={documentColors}
              isGenerating={isGenerating}
              onColorSelect={(color) => onChange?.(color)}
            />
          ),
        },
      }}
    />
  );
}
