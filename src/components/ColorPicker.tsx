import { useMemo, useEffect, forwardRef } from "react";
import { MuiColorInput, type MuiColorInputProps } from "mui-color-input";
import {
  Box,
  ButtonBase,
  Typography,
  CircularProgress,
  PopoverPaper,
  type PaperProps,
  Stack,
} from "@mui/material";
import { useCardPalettes } from "./useCardPalettes";

// Updated type to reflect the nested Record structure
type PaletteGroups = Record<string, Record<string, string[]>>;

const CustomPaper = forwardRef<
  HTMLDivElement,
  PaperProps & {
    palettes: PaletteGroups;
    onColorSelect: (color: string) => void;
    isGenerating: boolean;
  }
>(({ palettes, onColorSelect, isGenerating, children, ...rest }, ref) => {
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
        maxHeight="300px" // Slightly increased to handle more rows
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
                sx={{ borderLeft: "2px solid", borderColor: "divider", pl: 1 }}
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

                {/* Nested Loop for each Key within the card */}
                <Stack spacing={1}>
                  {Object.entries(categories).map(([keyName, colors]) => (
                    <Box key={keyName}>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.2}>
                        {colors.map((color, index) => (
                          <ButtonBase
                            key={`${elementId}-${keyName}-${color}-${index}`}
                            onClick={() => onColorSelect(color)}
                            sx={{
                              width: 22, // Slightly smaller to fit rows better
                              height: 22,
                              backgroundColor: color,
                              borderRadius: 0.5,
                              border: "1px solid",
                              borderColor: "divider",
                              "&:hover": { transform: "scale(1.2)", zIndex: 1 },
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
});

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

  // Updated filter to check nested objects
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
      slotProps={{
        input: { sx: { paddingLeft: 1 } },
        htmlInput: { sx: { padding: 1 } },
        ...slotProps,
      }}
      PopoverProps={{
        slots: {
          ...PopoverProps,
          paper: (paperProps) => (
            <CustomPaper
              {...paperProps}
              palettes={groupedPalettes}
              isGenerating={isGenerating}
              onColorSelect={(color) => onChange?.(color)}
            />
          ),
        },
      }}
    />
  );
}
