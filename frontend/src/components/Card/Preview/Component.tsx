import { Box } from "@mui/material";
import { useActiveCardStore } from "@src/stores/useActiveCardStore";
import { ELEMENT_REGISTRY, type Element } from "../Element";
import { useSharedElement } from "../ElementRefContext";
import Background from "./Background";

/**
 * Renders the correct preview component for a given element in a type-safe way.
 */
const ElementPreview = ({ element }: { element: Element }) => {
  if (element.type === "text") {
    const Preview = ELEMENT_REGISTRY.text.preview;
    return <Preview {...element.value} id={element.id} />;
  }
  
  if (element.type === "image") {
    const Preview = ELEMENT_REGISTRY.image.preview;
    return <Preview {...element.value} id={element.id} />;
  }

  return null;
};

/**
 * PreviewCard renders a high-fidelity visual representation of the card 
 * being edited. It uses the ELEMENT_REGISTRY to dynamically render the 
 * correct preview component for each element type.
 */
export default function PreviewCard() {
  const { elements } = useActiveCardStore();
  const { setElement } = useSharedElement();

  return (
    <Box width="20%" position="relative" minWidth="400px">
      <Background ref={setElement}>
        {elements.map((element) => (
          <Box
            key={element.id}
            width="100%"
            flexGrow={element.style.grow ? 1 : 0}
            alignContent={element.style.align}
          >
            <ElementPreview element={element} />
          </Box>
        ))}
      </Background>
    </Box>
  );
}
