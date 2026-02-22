import { forwardRef, useEffect, useMemo } from "react";
import {
  Box,
  ButtonBase,
  CircularProgress,
  PopoverPaper,
  Stack,
  Typography,
  type PaperProps,
} from "@mui/material";
import { MuiColorInput, type MuiColorInputProps } from "mui-color-input";
import { useCardPalettes } from "./useCardPalettes";

type PaletteGroups = Record<string, Record<string, string[]>>;

type CustomPaperProps = PaperProps & {
  /** Map of element IDs to their categorized color palettes */
  palettes: PaletteGroups;
  /** Callback when a color from a palette is selected */
  onColorSelect: (color: string) => void;
  /** Whether palettes are currently being generated */
  isGenerating: boolean;
};

/**
 * CustomPaper extends the default PopoverPaper to include a color palette panel
 * generated from images on the card.
 */
const CustomPaper = forwardRef<HTMLDivElement, CustomPaperProps>(
  ({ palettes, onColorSelect, isGenerating, children, ...rest }, ref) => {
    const cardEntries = Object.entries(palettes);

    return (
      <PopoverPaper {...rest} ref={ref}>
        {children}

        <Box
          p={1.5}
          borderTop="1px solid"
          borderColor="divider"
          bgcolor="background.default"
          width="300px"
          maxHeight="300px"
          sx={{ overflowY: "auto" }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight="bold"
            display="block"
            mb={1.5}
          >
            {isGenerating ? "Analyzing cards..." : "Colors by Card"}
          </Typography>

          <Stack spacing={2}>
            {isGenerating && cardEntries.length === 0 ? (
              <CircularProgress size={16} />
            ) : cardEntries.length > 0 ? (
              cardEntries.map(([elementId, categories]) => (
                <Box
                  key={elementId}
                  sx={{
                    borderLeft: "2px solid",
                    borderColor: "divider",
                    pl: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="primary"
                    fontWeight="medium"
                    sx={{
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    Image {elementId.slice(-4)}
                  </Typography>

                  <Stack spacing={1}>
                    {Object.entries(categories).map(([keyName, colors]) => (
                      <Box key={keyName}>
                        <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.2}>
                          {colors.map((color, index) => (
                            <ButtonBase
                              key={`${elementId}-${keyName}-${color}-${index}`}
                              onClick={() => onColorSelect(color)}
                              sx={{
                                width: 22,
                                height: 22,
                                backgroundColor: color,
                                borderRadius: 0.5,
                                border: "1px solid",
                                borderColor: "divider",
                                "&:hover": {
                                  transform: "scale(1.2)",
                                  zIndex: 1,
                                },
                              }}
                              title={`${keyName}: ${color}`}
                            />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ))
            ) : (
              <Typography variant="caption" color="text.disabled">
                No colors found.
              </Typography>
            )}
          </Stack>
        </Box>
      </PopoverPaper>
    );
  },
);

CustomPaper.displayName = "CustomPaper";

/**
 * ColorPicker is a specialized MuiColorInput that includes an image-based color palette suggestion tool.
 * It automatically extracts prominent colors from card images to assist with thematic styling.
 * 
 * @param props - MuiColorInputProps excluding onChange, plus a simplified onChange callback.
 */
export function ColorPicker({
  value,
  onChange,
  PopoverProps,
  slotProps,
  ...rest
}: Omit<MuiColorInputProps, "onChange"> & {
  onChange: (color: string) => void;
}) {
  const { palettes, isGenerating, generateAllPalettes } = useCardPalettes(10);

  useEffect(() => {
    generateAllPalettes(true);
  }, [generateAllPalettes]);

  const groupedPalettes = useMemo(() => {
    return Object.fromEntries(
      Object.entries(palettes).filter(([, categories]) =>
        Object.values(categories).some((colors) => colors.length > 0),
      ),
    );
  }, [palettes]);

  return (
    <MuiColorInput
      {...rest}
      fullWidth
      format="hex"
      value={value}
      onChange={onChange}
      isAlphaHidden
      slotProps={{
        input: { sx: { paddingLeft: 1 } },
        htmlInput: { sx: { padding: 1 } },
        ...slotProps,
      }}
      PopoverProps={{
        ...PopoverProps,
        slots: {
          ...PopoverProps?.slots,
          paper: CustomPaper,
        },
        slotProps: {
          ...PopoverProps?.slotProps,
          paper: {
            ...PopoverProps?.slotProps?.paper,
            palettes: groupedPalettes,
            isGenerating,
            onColorSelect: onChange,
          } as CustomPaperProps,
        },
      }}
    />
  );
}
