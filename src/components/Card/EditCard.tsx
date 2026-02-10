import { Box } from "@mui/material";
import CardMenu from "../CardMenu";
import { ImageElement, TextElement } from "./Element";
import { useElementRegistry } from "./Element/useElementRegistry";
import BaseCard from "./BaseCard";

export default function EditCard() {
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
