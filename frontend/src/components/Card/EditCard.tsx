import { useState } from "react";
import { Box } from "@mui/material";
import BaseCard from "./BaseCard";
import BottomCardMenu from "./BottomCardMenu";
import CardMenu from "./CardMenu";
import { ImageElement, TextElement } from "./Element";
import { useElementRegistry } from "./Element/useElementRegistry";
import { useSharedElement } from "./ElementRefContext";

/**
 * EditCard provides the primary interactive interface for modifying a card's content.
 * It renders a dynamic list of elements within a BaseCard and manages the 
 * layout for the top and bottom toolbars.
 */
export default function EditCard() {
  const { elements } = useElementRegistry();
  const [containerEl, setContainerEl] = useState<HTMLElement | null>(null);
  const { setSettingsAnchor } = useSharedElement();

  return (
    <Box
      ref={setContainerEl}
      display="flex"
      position="relative"
      flexDirection="column"
      width="20%"
      marginTop="-40px"
      minWidth={400}
    >
      <CardMenu>
        {/* Portal target for element-specific configuration toolbars */}
        <Box ref={setSettingsAnchor} className="settings-menu" />
      </CardMenu>
      
      <BaseCard>
        {elements.map((element) => (
          <Box
            key={element.id}
            width="100%"
            flexGrow={element.style.grow ? 1 : 0}
            alignContent={element.style.align}
          >
            {element.type === "text" ? (
              <TextElement id={element.id} />
            ) : (
              <ImageElement id={element.id} />
            )}
          </Box>
        ))}
      </BaseCard>

      <BottomCardMenu anchorEl={containerEl} />
    </Box>
  );
}
