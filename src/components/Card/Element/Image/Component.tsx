import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { useElementRegistry } from "../useElementRegistry";
import SourceTooltip from "./SourceTooltip";
import WidthTooltip from "../WidthTooltip";
import RadiusTooltip from "./RadiusTooltip";
import Element from "../Element";

export default function ImageElement({ id }: { id: string }) {
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSrcOpen(false);
      setWidthOpen(false);
      setRadiusOpen(false);
    }
  }, [id, activeSettingsId]);

  if (element?.type !== "image") return null;
  const { src, radius, width } = element.value;
  const isVisible = !!srcOpen || !!widthOpen || !!radiusOpen;

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
                isOpen={!!srcOpen}
                onClose={() => setSrcOpen(false)}
                onUpdate={(val) => updateElement<"image">(id, { src: val })}
              />
            ),
            onClick: () => setSrcOpen(true),
          },
          {
            children: (
              <WidthTooltip
                width={width}
                isOpen={!!widthOpen}
                onClose={() => setWidthOpen(false)}
                onUpdate={(val) => updateElement<"image">(id, { width: val })}
              />
            ),
            onClick: () => setWidthOpen(true),
          },
          {
            children: (
              <RadiusTooltip
                radius={radius}
                isOpen={!!radiusOpen}
                onClose={() => setRadiusOpen(false)}
                onUpdate={(val) => updateElement<"image">(id, { radius: val })}
              />
            ),
            onClick: () => setRadiusOpen(true),
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
