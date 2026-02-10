import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpward,
  ArrowDownward,
  Delete,
  Expand,
  Settings,
} from "@mui/icons-material";
import {
  Fade,
  ButtonGroup,
  Button,
  type ButtonProps,
  Tooltip,
  ClickAwayListener,
  Popper,
} from "@mui/material";
import { omit } from "lodash";
import { useElementRegistry } from "../useElementRegistry";
import { BUTTON_STYLES, getToggleStyles, ICON_STYLES } from "../styles";
import VerticalAlignmentTooltip from "./VerticalAlignmentTooltip";
import usePopperRef from "../usePopperRef";

export interface MenuProps {
  visible?: boolean;
  obstructed?: boolean;
  buttons?: (React.ReactElement | ButtonProps)[];
  settings?: (React.ReactElement | ButtonProps)[];
  id: string;
}

export default function Menu({
  visible = false,
  obstructed = false,
  settings,
  buttons,
  id,
}: MenuProps) {
  const popperRef = usePopperRef();
  const settingsPopperRef = usePopperRef();
  const { unregisterElement, elements, moveElement, updateStyle } =
    useElementRegistry();
  const index = elements.findIndex((element) => element.id === id);
  const element = useElementRegistry((state) => state.getElement(id));

  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLElement | null>(
    null,
  );
  const settingsOpen = Boolean(settingsAnchorEl);

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
    return;
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

  const open = visible || settingsOpen || vaOpen;

  return (
    <>
      <div
        ref={anchorRef}
        style={{ position: "absolute", width: 0, height: 0 }}
      />
      {!obstructed && (
        <Popper
          popperRef={popperRef}
          open={Boolean(open && parentElement)}
          anchorEl={parentElement}
          placement="bottom-end"
          transition
          disablePortal={false}
          modifiers={[
            {
              name: "offset",
              options: {
                offset: [0, 0],
              },
            },
            {
              name: "flip",
              enabled: true,
              options: {
                padding: 8,
              },
            },
            {
              name: "preventOverflow",
              enabled: true,
              options: {
                boundary: "clippingParents",
              },
            },
            {
              name: "hide",
              enabled: true,
            },
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
                  pointerEvents: "auto",
                  minHeight: 0,
                  whiteSpace: "nowrap",
                })}
              >
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  sx={BUTTON_STYLES}
                  onClick={handleMoveUp}
                >
                  <ArrowUpward sx={ICON_STYLES} />
                </Button>
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  sx={BUTTON_STYLES}
                  onClick={handleMoveDown}
                >
                  <ArrowDownward sx={ICON_STYLES} />
                </Button>
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  sx={(theme) => ({
                    ...BUTTON_STYLES(theme),
                    ...getToggleStyles(element.style.grow)(theme),
                  })}
                  onClick={() => updateStyle(id, { grow: !element.style.grow })}
                >
                  <Expand sx={ICON_STYLES} />
                </Button>
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  sx={BUTTON_STYLES}
                  onClick={(event) => setVaAnchorEl(event.currentTarget)}
                >
                  <VerticalAlignmentTooltip
                    alignment={element.style.align}
                    isOpen={vaOpen}
                    onClose={() => setVaAnchorEl(null)}
                    onUpdate={(align) => updateStyle(id, { align })}
                  />
                </Button>
                {buttons?.map((button) => {
                  if (React.isValidElement(button)) {
                    return button;
                  } else {
                    return (
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
                        {...omit(button, "sx")}
                      />
                    );
                  }
                })}
                {settings && (
                  <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    sx={BUTTON_STYLES}
                    onClick={(event) =>
                      setSettingsAnchorEl(event.currentTarget)
                    }
                  >
                    <Tooltip
                      open={settingsOpen}
                      title={
                        <ClickAwayListener
                          onClickAway={() => setSettingsAnchorEl(null)}
                        >
                          <ButtonGroup
                            sx={{
                              minHeight: 0,
                              zIndex: 1,
                            }}
                          >
                            {settings?.map((button) => {
                              if (React.isValidElement(button)) {
                                return button;
                              } else {
                                return (
                                  <Button
                                    size="small"
                                    color="primary"
                                    variant="contained"
                                    sx={(theme) => {
                                      if (!button.sx) {
                                        return BUTTON_STYLES(theme);
                                      } else if (
                                        typeof button.sx === "function"
                                      ) {
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
                                    {...omit(button, "sx")}
                                  />
                                );
                              }
                            })}
                          </ButtonGroup>
                        </ClickAwayListener>
                      }
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: (theme) => ({
                            backgroundColor: theme.palette.primary.main,
                            padding: 0,
                            borderRadius: theme.spacing(4),
                            display: "flex",
                            justifyContent: "center",
                          }),
                        },
                        arrow: {
                          sx: (theme) => ({
                            color: theme.palette.primary.main,
                          }),
                        },
                        popper: {
                          popperRef: settingsPopperRef,
                          modifiers: [
                            {
                              name: "offset",
                              options: {
                                offset: [0, -8],
                              },
                            },
                          ],
                        },
                      }}
                    >
                      <Settings sx={ICON_STYLES} />
                    </Tooltip>
                  </Button>
                )}
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  sx={BUTTON_STYLES}
                  onClick={() => unregisterElement(id)}
                >
                  <Delete sx={ICON_STYLES} />
                </Button>
              </ButtonGroup>
            </Fade>
          )}
        </Popper>
      )}
    </>
  );
}
