import { Box, Paper, type PaperProps, type Theme } from "@mui/material";
import CardMenu from "../CardMenu";
import { ImageElement, TextElement } from "./Element";
import { useElementRegistry } from "./Element/useElementRegistry";
import { PreviewCard } from "./Preview";
import { mergeSx } from "../../utils/mergeSx";

const BASE_STYLES = (theme: Theme) => ({
  "&:has(~ .card-menu)": {
    borderBottomLeftRadius: "0px",
    borderBottomRightRadius: "0px",
  },

  aspectRatio: "5/7",
  overflow: "hidden",
  padding: theme.spacing(1),
});

function BaseCard({ children, sx }: PaperProps) {
  return (
    <Paper
      id="base-card-paper-container"
      sx={mergeSx(BASE_STYLES, sx)}
      elevation={4}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexGrow: 1,
          width: "100%",
          height: "100%",
          overflowY: "auto",
          gap: theme.spacing(1),
        })}
      >
        {children}
      </Box>
    </Paper>
  );
}

function EditCard() {
  const { elements } = useElementRegistry();

  return (
    <Box flexDirection="column" width="20%" minWidth="400px">
      <BaseCard>
        {elements
          .map((element) => {
            switch (element.type) {
              case "text":
                return [element, <TextElement id={element.id} />] as const;
              case "image":
                return [element, <ImageElement id={element.id} />] as const;
            }
          })
          .map(([element, children]) => (
            <Box
              width="100%"
              flexGrow={element.style.grow ? 1 : 0}
              alignContent={element.style.align}
              key={element.id}
            >
              {children}
            </Box>
          ))}
      </BaseCard>
      <CardMenu />
    </Box>
  );
}

export default function Card() {
  return (
    <Box
      width="100%"
      display="flex"
      justifyContent="center"
      sx={(theme) => ({ gap: theme.spacing(1) })}
    >
      <EditCard />
      <PreviewCard />
    </Box>
  );
}
