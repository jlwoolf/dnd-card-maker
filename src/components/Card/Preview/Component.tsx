import { Box, Typography } from "@mui/material";
import { useElementRegistry } from "../Element/useElementRegistry";
import Background from "./Background";
import Text from "./Text";
import Image from "./Image";
import { useSharedElement } from "../ElementRefContext";

export default function PreviewCard() {
  const { elements } = useElementRegistry();
  const { setElement } = useSharedElement();

  return (
    <Box width="20%" position="relative" minWidth="400px">
      <Background ref={setElement}>
        {elements
          .map((element) => {
            switch (element.type) {
              case "text": {
                const {
                  value,
                  bold,
                  italic,
                  size,
                  alignment,
                  variant,
                  width,
                  expand,
                } = element.value;
                const values = value.split("\n");
                const typography = values.map((v, index) => (
                  <Typography
                    key={index}
                    component="p"
                    whiteSpace="pre-line"
                    lineHeight={"1.2"}
                    fontSize={size}
                    textAlign={alignment}
                    fontWeight={bold ? "bold" : "normal"}
                    fontStyle={italic ? "italic" : "normal"}
                    sx={{
                      wordBreak: "break-word",
                      marginBottom:
                        index < values.length - 1 ? "0.5em" : undefined,
                    }}
                  >
                    {v ? v : <>&nbsp;</>}
                  </Typography>
                ));
                return [
                  element,
                  <Text variant={variant} width={width} expand={expand}>
                    {typography}
                  </Text>,
                ] as const;
              }

              case "image": {
                const { src, radius, width } = element.value;
                return [
                  element,
                  <Image radius={radius} width={width}>
                    <Box
                      component="img"
                      src={src || "https://placehold.co/600x400"}
                      sx={{
                        width: `100%`,
                        display: "block",
                        objectFit: "cover",
                        transition: "all 0.2s ease-in-out",
                      }}
                    />
                  </Image>,
                ] as const;
              }

              default:
                return [];
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
      </Background>
    </Box>
  );
}
