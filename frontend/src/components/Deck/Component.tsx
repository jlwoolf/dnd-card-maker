import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  GridView,
  Upload,
} from "@mui/icons-material";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import Tooltip from "../Tooltip";
import useExportCards from "../useExportCards";
import { useSnackbar } from "../useSnackbar";
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

  /** Advances the stack to the next card */
  const nextCard = () => setActiveIndex((prev) => (prev + 1) % cards.length);
  
  /** Moves the stack to the previous card */
  const prevCard = () =>
    setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Box
      component="section"
      aria-label="Card Deck"
      data-testid="deck-container"
      sx={{
        position: "fixed",
        bottom: 60,
        left: { xs: 20, md: "unset" },
        right: { xs: "unset", md: 40 },
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
                x: 0 + offsetFromActive * 2 * (isDesktop ? 1 : -1),
                y: 0 - offsetFromActive * 2,
                scale: 0.9,
                zIndex: zIndex,
              },
              active: {
                x: isDesktop ? -120 : 60,
                y: isDesktop ? -250 : -200,
                scale: 2.2,
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
              {isActive && true && !isCollapsed && (
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
          left: { xs: 0, md: "unset" },
          right: { xs: "unset", md: -20 },
          width: { xs: "100%", md: "auto" },
          height: "40px",
          display: "flex",
          justifyContent: { xs: "center", md: "flex-end" },
          alignItems: "center",
          zIndex: 600,
          pointerEvents: "none",
          gap: { xs: "unset", md: "8px" },
        }}
      >
        {!isDesktop && (
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
                x: isDesktop ? 0 : "-50%",
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: isDesktop ? 0 : "-50%",
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                x: isDesktop ? 0 : "-50%",
                y: 10,
              }}
              style={{
                display: "flex",
                flexWrap: isDesktop ? "nowrap" : "wrap",
                justifyContent: "center",
                maxWidth: isDesktop ? "none" : "190px",
                gap: isDesktop ? "12px" : "8px",
                alignItems: "center",
                pointerEvents: "auto",
                position: isDesktop ? "static" : "absolute",
                bottom: 0,
                left: isDesktop ? "auto" : "50%",
              }}
            >
              <Tooltip title="View Grid">
                <ControlButton
                  onClick={onOpenDeckView}
                  label="View card grid"
                  icon={<GridView />}
                  data-testid="view-grid-btn"
                />
              </Tooltip>

              <DownloadButton data-testid="download-deck-btn" />

              <Tooltip title="Upload File">
                <UploadButton
                  onUpload={(data) => {
                    loadFile(data);
                    showSnackbar("Deck loaded successfully", "success");
                  }}
                  icon={<Upload />}
                  data-testid="upload-deck-btn"
                  aria-label="Upload deck JSON file"
                />
              </Tooltip>

              <PdfButton data-testid="export-pdf-btn" />

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
            </motion.div>
          )}
        </AnimatePresence>

        {isDesktop && (
          <ControlButton
            onClick={() => setIsCollapsed(!isCollapsed)}
            label={isCollapsed ? "Expand deck controls" : "Collapse deck controls"}
            icon={isCollapsed ? <ExpandLess /> : <ExpandMore />}
            data-testid="collapse-deck-btn-desktop"
          />
        )}
      </Box>
    </Box>
  );
};

export default Deck;
