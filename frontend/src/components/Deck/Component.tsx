import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  ExpandLess,
  ExpandMore,
  GridView,
  Upload,
} from "@mui/icons-material";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useResponsiveZoom } from "@src/hooks/useResponsiveZoom";
import SaveDeckDialog from "../SaveDeckDialog";
import Tooltip from "../Tooltip";
import useExportCards from "@src/hooks/useExportCards";
import { useSnackbar } from "@src/hooks/useSnackbar";
import CardButtons from "./CardButtons";
import ControlButton from "./ControlButton";
import DownloadButton from "./DownloadButton";
import PdfButton from "./PdfButton";
import UploadButton from "./UploadButton";

const CARD_WIDTH = 100;
const CARD_HEIGHT = 140;

interface DeckProps {
  /** Callback triggered when the user wants to open the full-screen grid view */
  onOpenDeckView?: () => void;
}

/**
 * Deck renders an interactive, animated stack of cards.
 * It provides high-level controls for navigating the deck, importing/exporting 
 * data, and opening the full-screen management view. It features responsive 
 * positioning and animations using Framer Motion.
 */
const Deck = ({ onOpenDeckView }: DeckProps) => {
  const cards = useExportCards((state) => state.cards);
  const loadFile = useExportCards((state) => state.loadFile);
  const showSnackbar = useSnackbar((state) => state.showSnackbar);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHoveringActive, setIsHoveringActive] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [saveDeckOpen, setSaveDeckOpen] = useState(false);

  /** Advances the stack to the next card */
  const nextCard = () => setActiveIndex((prev) => (prev + 1) % cards.length);
  
  /** Moves the stack to the previous card */
  const prevCard = () =>
    setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);

  const theme = useTheme();
  const { isColumn, zoom } = useResponsiveZoom();
  const isDesktopLayout = useMediaQuery(theme.breakpoints.up("md"));
  const isDesktop = isDesktopLayout && !isColumn;

  return (
    <>
    <Box
      component="section"
      aria-label="Card Deck"
      data-testid="deck-container"
      sx={{
        position: "fixed",
        bottom: 60,
        left: 20,
        zIndex: 500,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        isolation: "isolate",
      }}
    >
      {cards.map((card, index) => {
        const isActive = index === activeIndex;
        let offsetFromActive = index - activeIndex;
        if (offsetFromActive < 0) offsetFromActive += cards.length;

        if (isDesktop && offsetFromActive > 16) return null;
        if (!isDesktop && offsetFromActive > 8) return null;

        const zIndex = isActive ? 100 : cards.length - offsetFromActive;

        return (
          <motion.div
            key={card.id}
            data-testid={`deck-card-${card.id}`}
            aria-current={isActive ? "true" : undefined}
            onClick={() => isActive && setIsHoveringActive(!isHoveringActive)}
            onMouseEnter={() => isActive && setIsHoveringActive(true)}
            onMouseLeave={() => isActive && setIsHoveringActive(false)}
            animate={isActive && !isCollapsed ? "active" : "stacked"}
            variants={{
              stacked: {
                x: offsetFromActive * 2,
                y: 0 - offsetFromActive * 2,
                scale: 0.9,
                zIndex: zIndex,
              },
              active: {
                x: isColumn ? 20 : 60 * zoom,
                y: isColumn ? 0 : -202 * zoom,
                scale: 2.2 * zoom,
                rotate: 0,
                zIndex: 100,
              },
            }}
            style={{
              position: "absolute",
              bottom: 20,
              right: 0,
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              transformOrigin: "bottom center",
              borderRadius: "8px",
              background: "white",
              boxShadow: isActive
                ? "0 20px 50px rgba(0,0,0,0.5)"
                : "0 2px 5px rgba(0,0,0,0.2)",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.8)",
              cursor: isActive ? "default" : "pointer",
            }}
          >
            <AnimatePresence>
              {isActive && isHoveringActive && !isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  data-testid="active-card-actions"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    zIndex: 110,
                  }}
                >
                  <CardButtons card={card} onDelete={() => setActiveIndex(0)} />
                </motion.div>
              )}
            </AnimatePresence>

            <img
              src={card.imgUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                pointerEvents: "none",
              }}
            />
          </motion.div>
        );
      })}

      <Box
        role="group"
        aria-label="Deck controls"
        data-testid="deck-controls"
        sx={{
          position: { xs: "fixed", md: "absolute" },
          bottom: { xs: 20, md: -40 },
          left: { xs: 0, md: 0 },
          width: { xs: "100%", md: "auto" },
          height: "40px",
          display: "flex",
          justifyContent: { xs: "center", md: "flex-start" },
          alignItems: "center",
          zIndex: 600,
          pointerEvents: "none",
          gap: { xs: "unset", md: "8px" },
        }}
      >
        {isDesktopLayout && (
          <ControlButton
            onClick={() => setIsCollapsed(!isCollapsed)}
            label={isCollapsed ? "Expand deck controls" : "Collapse deck controls"}
            icon={isCollapsed ? <ExpandLess /> : <ExpandMore />}
            data-testid="collapse-deck-btn-desktop"
          />
        )}

        {!isDesktopLayout && (
          <Box
            sx={{
              position: "absolute",
              left: 20,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <ControlButton
              onClick={() => setIsCollapsed(!isCollapsed)}
              label={isCollapsed ? "Expand deck controls" : "Collapse deck controls"}
              icon={isCollapsed ? <ExpandLess /> : <ExpandMore />}
              data-testid="collapse-deck-btn-mobile"
            />
          </Box>
        )}

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.8,
                x: isDesktopLayout ? -20 : "-50%",
                y: isDesktopLayout ? 0 : 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: isDesktopLayout ? 0 : "-50%",
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                x: isDesktopLayout ? -20 : "-50%",
                y: isDesktopLayout ? 0 : 10,
              }}
              style={{
                display: "flex",
                flexWrap: isDesktopLayout ? "nowrap" : "wrap",
                justifyContent: "center",
                maxWidth: isDesktopLayout ? "none" : "190px",
                gap: isDesktopLayout ? "12px" : "8px",
                alignItems: "center",
                pointerEvents: "auto",
                position: isDesktopLayout ? "static" : "absolute",
                bottom: 0,
                left: isDesktopLayout ? "auto" : "50%",
              }}
            >
              <Tooltip title="Save Deck to Cloud">
                <ControlButton
                  onClick={() => setSaveDeckOpen(true)}
                  label="Save deck to cloud"
                  icon={<CloudUpload />}
                  data-testid="save-deck-btn"
                />
              </Tooltip>

              <Tooltip title="Previous Card">
                <ControlButton
                  onClick={prevCard}
                  label="Previous card in stack"
                  icon={<ChevronLeft />}
                  data-testid="prev-card-btn"
                />
              </Tooltip>

              <Tooltip title="Next Card">
                <ControlButton
                  onClick={nextCard}
                  label="Next card in stack"
                  icon={<ChevronRight />}
                  data-testid="next-card-btn"
                />
              </Tooltip>

              <PdfButton data-testid="export-pdf-btn" />

              <Tooltip title="Upload File">
                <UploadButton
                  onUpload={(data) => {
                    if (loadFile(data)) {
                      showSnackbar("Deck loaded successfully", "success");
                    } else {
                      showSnackbar(
                        "Failed to load deck: invalid file format",
                        "error",
                      );
                    }
                  }}
                  icon={<Upload />}
                  data-testid="upload-deck-btn"
                  aria-label="Upload deck JSON file"
                />
              </Tooltip>

              <DownloadButton data-testid="download-deck-btn" />

              <Tooltip title="View Grid">
                <ControlButton
                  onClick={onOpenDeckView}
                  label="View card grid"
                  icon={<GridView />}
                  data-testid="view-grid-btn"
                />
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
    <SaveDeckDialog
      open={saveDeckOpen}
      onClose={() => setSaveDeckOpen(false)}
    />
    </>
  );
};

export default Deck;
