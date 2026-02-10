import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Delete,
  Download,
  Edit,
  ExpandLess,
  ExpandMore,
  Upload,
} from "@mui/icons-material";
import { useElementRegistry } from "../Card/Element/useElementRegistry";
import ActionButton from "./ActionButton";
import ControlButton from "./ControlButton";
import UploadButton from "./UploadButton";
import useExportCards from "../useExportCards";
import { useSnackbar } from "../useSnackbar";

// CONFIGURATION
const CARD_WIDTH = 100;
const CARD_HEIGHT = 140;

const Deck = () => {
  const cards = useExportCards((state) => state.cards);
  const removeCard = useExportCards((state) => state.removeCard);
  const loadFile = useExportCards((state) => state.loadFile);
  const loadCard = useElementRegistry((state) => state.loadCard);
  const showSnackbar = useSnackbar((state) => state.showSnackbar);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHoveringActive, setIsHoveringActive] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const nextCard = () => setActiveIndex((prev) => (prev + 1) % cards.length);
  const prevCard = () =>
    setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 60,
        right: 40,
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
        if (offsetFromActive > 20) return null;

        const zIndex = isActive ? 100 : cards.length - offsetFromActive;

        return (
          <motion.div
            key={card.id}
            onMouseEnter={() => isActive && setIsHoveringActive(true)}
            onMouseLeave={() => isActive && setIsHoveringActive(false)}
            animate={isActive && !isCollapsed ? "active" : "stacked"}
            variants={{
              stacked: {
                x: 0 + offsetFromActive * 2,
                y: 0 - offsetFromActive * 2,
                scale: 0.9,
                zIndex: zIndex,
              },
              active: {
                x: -120,
                y: -250,
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
            {/* Action Buttons Overlay */}
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
                  <ActionButton
                    icon={<Edit style={{ fontSize: 14 }} />}
                    color="#3b82f6"
                    onClick={() => {
                      loadCard(card.elements, card.id);
                      showSnackbar("Card loaded into editor", "info");
                    }}
                  />
                  <ActionButton
                    icon={<Delete style={{ fontSize: 14 }} />}
                    color="#ef4444"
                    onClick={() => {
                      removeCard(card.id);
                      setActiveIndex(0);
                      showSnackbar("Card removed from deck", "warning");
                    }}
                  />
                  <ActionButton
                    icon={<Download style={{ fontSize: 14 }} />}
                    color="#0e9e0c"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.download = `card-${card.id}.png`;
                      link.href = card.imgUrl;
                      link.click();
                      showSnackbar("Image downloaded", "success");
                    }}
                  />
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
      <div
        style={{
          position: "absolute",
          bottom: -40,
          right: 30,
          display: "flex",
          gap: "12px",
          zIndex: 600,
        }}
      >
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{ display: "flex", gap: "12px" }}
            >
              <ControlButton
                icon={<Download />}
                onClick={() => {
                  const jsonString = JSON.stringify(cards, null, 2);

                  const blob = new Blob([jsonString], {
                    type: "application/json",
                  });

                  const href = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = href;
                  link.download = "cards_data.json"; // Name of the file

                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(href);
                  showSnackbar("Deck exported to JSON", "success");
                }}
              />
              <UploadButton
                onUpload={(data) => {
                  loadFile(data);
                  showSnackbar("Deck loaded successfully", "success");
                }}
                icon={<Upload />}
              />
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
        <ControlButton
          onClick={() => setIsCollapsed(!isCollapsed)}
          label={isCollapsed ? "Expand" : "Collapse"}
          icon={isCollapsed ? <ExpandLess /> : <ExpandMore />}
        />
      </div>
    </div>
  );
};

export default Deck;
