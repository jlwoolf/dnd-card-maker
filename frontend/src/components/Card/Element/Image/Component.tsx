import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useElementRegistry } from "../useElementRegistry";
import Element from "../Element";
import RadiusTooltip from "./RadiusTooltip";
import SourceTooltip from "./SourceTooltip";
import WidthTooltip from "../WidthTooltip";

interface ImageElementProps {
  /** Unique identifier for the image element */
  id: string;
}

/**
 * ImageElement renders an editable image within the card editor.
 * It provides tools for updating the image source, width, and border radius.
 */
export default function ImageElement({ id }: ImageElementProps) {
  const element = useElementRegistry((state) => state.getElement(id));
  const updateElement = useElementRegistry((state) => state.updateElement);
  const activeSettingsId = useElementRegistry(
    (state) => state.activeSettingsId,
  );
  const setActiveSettingsId = useElementRegistry(
    (state) => state.setActiveSettingsId,
  );

  const [srcOpen, setSrcOpen] = useState(false);
  const [widthOpen, setWidthOpen] = useState(false);
  const [radiusOpen, setRadiusOpen] = useState(false);

  useEffect(() => {
    if (id !== activeSettingsId) {
      setSrcOpen(false);
      setWidthOpen(false);
      setRadiusOpen(false);
    }
  }, [id, activeSettingsId]);

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
