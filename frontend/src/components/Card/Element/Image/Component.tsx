import { useState } from "react";
import { Box } from "@mui/material";
import { useActiveCardStore } from "@src/stores/useActiveCardStore";
import Element from "../Element";
import WidthTooltip from "../WidthTooltip";
import RadiusTooltip from "./RadiusTooltip";
import SourceTooltip from "./SourceTooltip";

interface ImageElementProps {
  /** Unique identifier for the image element */
  id: string;
}

/**
 * ImageElement provides an editable image component for the card.
 * It integrates with the ElementRegistry to manage its source URL, 
 * display width, and border radius through interactive tooltips.
 */
export default function ImageElement({ id }: ImageElementProps) {
  const element = useActiveCardStore((state) => state.getElement(id));
  const updateElement = useActiveCardStore((state) => state.updateElement);
  const activeSettingsId = useActiveCardStore(
    (state) => state.activeSettingsId,
  );
  const setActiveSettingsId = useActiveCardStore(
    (state) => state.setActiveSettingsId,
  );

  const [srcOpen, setSrcOpen] = useState(false);
  const [widthOpen, setWidthOpen] = useState(false);
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [prevActiveId, setPrevActiveId] = useState(activeSettingsId);

  if (activeSettingsId !== prevActiveId) {
    setPrevActiveId(activeSettingsId);
    if (id !== activeSettingsId) {
      setSrcOpen(false);
      setWidthOpen(false);
      setRadiusOpen(false);
    }
  }

  if (element?.type !== "image") return null;

  const { src, radius, width } = element.value;
  const isVisible = srcOpen || widthOpen || radiusOpen;

  return (
    <Element
      onClick={() => setActiveSettingsId(id)}
      id={id}
      menuProps={{
        visible: isVisible,
        settings: [
          {
            children: (
              <SourceTooltip
                src={src}
                isOpen={srcOpen}
                onClose={() => setSrcOpen(false)}
                onUpdate={(val) => updateElement<"image">(id, { src: val })}
              />
            ),
            onClick: () => setSrcOpen(true),
            tooltip: "Source",
          },
          {
            children: (
              <WidthTooltip
                width={width}
                isOpen={widthOpen}
                onClose={() => setWidthOpen(false)}
                onUpdate={(val) => updateElement<"image">(id, { width: val })}
              />
            ),
            onClick: () => setWidthOpen(true),
            tooltip: "Width",
          },
          {
            children: (
              <RadiusTooltip
                radius={radius}
                isOpen={radiusOpen}
                onClose={() => setRadiusOpen(false)}
                onUpdate={(val) => updateElement<"image">(id, { radius: val })}
              />
            ),
            onClick: () => setRadiusOpen(true),
            tooltip: "Radius",
          },
        ],
      }}
    >
      <Box
        component="img"
        src={src || "https://placehold.co/600x400"}
        alt={id}
        sx={{
          width: `${width}%`,
          display: "block",
          objectFit: "cover",
          borderRadius: radius,
          transition: "all 0.2s ease-in-out",
        }}
      />
    </Element>
  );
}
