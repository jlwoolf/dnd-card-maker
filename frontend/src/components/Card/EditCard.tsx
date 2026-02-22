import { useState } from "react";
import { Box } from "@mui/material";
import BaseCard from "./BaseCard";
import BottomCardMenu from "./BottomCardMenu";
import CardMenu from "./CardMenu";
import { ELEMENT_REGISTRY } from "./Element";
import { useActiveCardStore } from "@src/stores/useActiveCardStore";
import { useSharedElement } from "./ElementRefContext";

/**
 * EditCard provides the primary interactive interface for modifying a card's content.
 * It renders a dynamic list of elements within a BaseCard, using the ELEMENT_REGISTRY 
 * to determine the correct editor for each element type.
 */
export default function EditCard() {
  const { elements } = useActiveCardStore();
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
        {elements.map((element) => {
          const { editor: Editor } = ELEMENT_REGISTRY[element.type];
          return (
            <Box
              key={element.id}
              width="100%"
              flexGrow={element.style.grow ? 1 : 0}
              alignContent={element.style.align}
            >
              <Editor id={element.id} />
            </Box>
          );
        })}
      </BaseCard>

      <BottomCardMenu anchorEl={containerEl} />
    </Box>
  );
}
