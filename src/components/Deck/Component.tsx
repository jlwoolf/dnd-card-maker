import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  Upload,
} from "@mui/icons-material";
import ControlButton from "./ControlButton";
import UploadButton from "./UploadButton";
import useExportCards from "../useExportCards";
import { useSnackbar } from "../useSnackbar";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import DownloadButton from "./DownloadButton";
import PdfButton from "./PdfButton";
import CardButtons from "./CardButtons";

const CARD_WIDTH = 100;
const CARD_HEIGHT = 140;

const Deck = () => {
  const cards = useExportCards((state) => state.cards);
  const loadFile = useExportCards((state) => state.loadFile);
  const showSnackbar = useSnackbar((state) => state.showSnackbar);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHoveringActive, setIsHoveringActive] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const nextCard = () => setActiveIndex((prev) => (prev + 1) % cards.length);
  const prevCard = () =>
    setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 60,
        // Keep the deck container itself on the left for mobile
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
        if (offsetFromActive > 16) return null;

        const zIndex = isActive ? 100 : cards.length - offsetFromActive;

        return (
          <motion.div
            key={card.id}
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
                // Modified X for mobile so it expands toward the center/right
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
              {isActive && isHoveringActive && !isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
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

      {/* --- THE CONTROLS --- */}
      <Box
        sx={{
          position: { xs: "fixed", md: "absolute" },
          bottom: { xs: 20, md: -40 },
          left: 0,
          width: "100%",
          md: {
            position: "absolute",
            left: "unset",
            right: 30,
            width: "auto",
          },
          height: "40px",
          display: "flex",
          justifyContent: { xs: "center", md: "flex-end" },
          alignItems: "center",
          zIndex: 600,
          pointerEvents: "none",
        }}
      >
        {/* Collapse button anchored to the left on mobile */}
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
              label={isCollapsed ? "Expand" : "Collapse"}
              icon={isCollapsed ? <ExpandLess /> : <ExpandMore />}
            />
          </Box>
        )}

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <DownloadButton />
              <UploadButton
                onUpload={(data) => {
                  loadFile(data);
                  showSnackbar("Deck loaded successfully", "success");
                }}
                icon={<Upload />}
              />
              <PdfButton />
              <ControlButton
                onClick={prevCard}
                label="Prev"
                icon={<ChevronLeft />}
              />
              <ControlButton
                onClick={nextCard}
                label="Next"
                icon={<ChevronRight />}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isDesktop && (
          <ControlButton
            onClick={() => setIsCollapsed(!isCollapsed)}
            label={isCollapsed ? "Expand" : "Collapse"}
            icon={isCollapsed ? <ExpandLess /> : <ExpandMore />}
          />
        )}
      </Box>
    </Box>
  );
};

export default Deck;
