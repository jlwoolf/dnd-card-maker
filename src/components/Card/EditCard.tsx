import { Box } from "@mui/material";
import BottomCardMenu from "./BottomCardMenu";
import { ImageElement, TextElement } from "./Element";
import { useElementRegistry } from "./Element/useElementRegistry";
import BaseCard from "./BaseCard";
import { useState } from "react";
import { useSharedElement } from "./ElementRefContext";
import CardMenu from "./CardMenu";

export default function EditCard() {
  const { elements } = useElementRegistry();
  const [containerEl, setContainerEl] = useState<HTMLElement | null>(null);
  const { setSettingsAnchor } = useSharedElement();

  return (
    <Box
      ref={(node: HTMLElement) => {
        setContainerEl(node);
      }}
      display="flex"
      position="relative"
      flexDirection="column"
      width="20%"
      marginTop="-40px"
      minWidth={400}
    >
      <CardMenu>
        <Box ref={setSettingsAnchor} className="settings-menu" />
      </CardMenu>
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
      <BottomCardMenu anchorEl={containerEl} />
    </Box>
  );
}
