import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpward,
  ArrowDownward,
  Delete,
  Expand,
} from "@mui/icons-material";
import {
  Fade,
  ButtonGroup,
  Button,
  type ButtonProps,
  Popper,
  Portal,
  Paper,
  IconButton,
  type Theme,
} from "@mui/material";
import { omit } from "lodash";
import { useElementRegistry } from "../useElementRegistry";
import VerticalAlignmentTooltip from "./VerticalAlignmentTooltip";
import usePopperRef from "../usePopperRef";
import { useSharedElement } from "../../ElementRefContext";
import { mergeSx } from "@src/utils/mergeSx";
import { Tooltip } from "@src/components";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BUTTON_STYLES = (_theme: Theme) => ({});

export interface MenuProps {
  visible?: boolean;
  obstructed?: boolean;
  focused?: boolean;
  buttons?: (React.ReactElement | ButtonProps)[];
  settings?: (React.ReactElement | (ButtonProps & { tooltip?: string }))[];
  id: string;
}

export default function Menu({
  visible = false,
  obstructed = false,
  focused = false,
  settings,
  buttons,
  id,
}: MenuProps) {
  const popperRef = usePopperRef();
  const { settingsAnchor } = useSharedElement();
  const {
    unregisterElement,
    elements,
    moveElement,
    updateStyle,
    activeSettingsId,
  } = useElementRegistry();
  const index = elements.findIndex((element) => element.id === id);
  const element = useElementRegistry((state) => state.getElement(id));

  const settingsOpen = activeSettingsId === id;

  const [vaAnchorEl, setVaAnchorEl] = useState<HTMLElement | null>(null);
  const vaOpen = Boolean(vaAnchorEl);

  const anchorRef = useRef<HTMLDivElement>(null);
  const [parentElement, setParentElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (anchorRef.current) {
      setParentElement(anchorRef.current.parentElement);
    }
  }, []);

  if (!element) {
    return null;
  }

  const handleMoveUp = () => {
    if (index > 0) {
      moveElement(index, index - 1);
    }
  };

  const handleMoveDown = () => {
    if (index < elements.length - 1) {
      moveElement(index, index + 1);
    }
  };

  const open = focused || visible || vaOpen;

  return (
    <>
      <div
        ref={anchorRef}
        style={{ position: "absolute", width: 0, height: 0 }}
      />
      {(!obstructed || focused) && (
        <Popper
          popperRef={popperRef}
          open={Boolean(open && parentElement)}
          anchorEl={parentElement}
          placement="bottom-end"
          transition
          disablePortal={true}
          modifiers={[
            { name: "offset", options: { offset: [0, 0] } },
            { name: "flip", enabled: true, options: { padding: 8 } },
            {
              name: "preventOverflow",
              enabled: true,
              options: { boundary: "clippingParents" },
            },
            { name: "hide", enabled: true },
          ]}
          sx={{
            zIndex: 1300,
            "&[data-popper-reference-hidden]": {
              visibility: "hidden",
              pointerEvents: "none",
            },
          }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={300}>
              <ButtonGroup
                sx={(theme) => ({
                  position: "absolute",
                  right: 0,
                  bottom: theme.spacing(-1.5),
                  maxHeight: theme.spacing(3),
                  pointerEvents: "auto",
                  minHeight: 0,
                  whiteSpace: "nowrap",

                  "& .MuiButtonBase-root": {
                    minHeight: 0,
                    padding: 0,
                  },

                  "& .MuiSvgIcon-root": {
                    aspectRatio: "1/1",
                    width: theme.spacing(2),
                  },
                })}
              >
                <Tooltip title="Move Up">
                  <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    onClick={handleMoveUp}
                  >
                    <ArrowUpward />
                  </Button>
                </Tooltip>

                <Tooltip title="Move Down">
                  <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    onClick={handleMoveDown}
                  >
                    <ArrowDownward />
                  </Button>
                </Tooltip>

                <Tooltip title={element.style.grow ? "Shrink" : "Grow"}>
                  <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    onClick={() =>
                      updateStyle(id, { grow: !element.style.grow })
                    }
                  >
                    <Expand />
                  </Button>
                </Tooltip>

                <Tooltip title="Vertical Alignment">
                  <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    onClick={(event) => setVaAnchorEl(event.currentTarget)}
                  >
                    <VerticalAlignmentTooltip
                      alignment={element.style.align}
                      isOpen={vaOpen}
                      onClose={() => setVaAnchorEl(null)}
                      onUpdate={(align) => updateStyle(id, { align })}
                    />
                  </Button>
                </Tooltip>

                {buttons?.map((button, i) => {
                  if (React.isValidElement(button)) {
                    return button;
                  } else {
                    return (
                      <Tooltip key={i} title={button.title || ""}>
                        <Button
                          size="small"
                          color="primary"
                          variant="contained"
                          sx={(theme) => {
                            if (!button.sx) {
                              return BUTTON_STYLES(theme);
                            } else if (typeof button.sx === "function") {
                              return {
                                ...BUTTON_STYLES(theme),
                                ...button.sx(theme),
                              };
                            } else {
                              return {
                                ...BUTTON_STYLES(theme),
                                ...button.sx,
                              };
                            }
                          }}
                          {...omit(button, ["sx", "title"])}
                        />
                      </Tooltip>
                    );
                  }
                })}

                <Tooltip title="Delete">
                  <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    onClick={() => unregisterElement(id)}
                  >
                    <Delete />
                  </Button>
                </Tooltip>
              </ButtonGroup>
            </Fade>
          )}
        </Popper>
      )}
      {/* Settings Portal Logic remains the same */}
      {settingsOpen && settingsAnchor && (
        <Portal container={settingsAnchor}>
          <Paper
            sx={{
              borderBottomLeftRadius: "0px",
              borderBottomRightRadius: "0px",
              backgroundColor: "grey.300",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              px: 1,

              ".MuiIconButton-root": {
                borderRadius: 0,
              },

              "& .MuiButtonBase-root": {
                backgroundColor: "grey.300",

                "&.toggled": {
                  backgroundColor: "grey.400",
                  boxShadow: "inset 0px 2px 4px rgba(0, 0, 0, 0.2)",

                  ".MuiSvgIcon-root": {
                    color: "grey.800",
                  },
                },
              },
            }}
          >
            {settings?.map((button, i) => {
              if (React.isValidElement(button)) {
                return React.cloneElement(button as React.ReactElement, {
                  key: i,
                });
              } else {
                const { children, sx, tooltip, ...props } = button;
                const element = (
                  <IconButton
                    key={i}
                    color="default"
                    sx={mergeSx(sx)}
                    {...props}
                  >
                    {children}
                  </IconButton>
                );

                if (tooltip) {
                  return <Tooltip title={tooltip}>{element}</Tooltip>;
                }

                return element;
              }
            })}
          </Paper>
        </Portal>
      )}
    </>
  );
}
