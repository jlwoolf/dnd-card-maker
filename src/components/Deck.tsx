import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useExportCards from "./useExportCards";
import {
  ChevronLeft,
  ChevronRight,
  Delete,
  Download,
  Edit,
  Upload,
} from "@mui/icons-material";
import { useElementRegistry } from "./Card/Element/useElementRegistry";

// CONFIGURATION
const CARD_WIDTH = 100;
const CARD_HEIGHT = 140;

export const Deck = () => {
  const cards = useExportCards((state) => state.cards);
  const removeCard = useExportCards((state) => state.removeCard);
  const loadFile = useExportCards((state) => state.loadFile);
  const loadCard = useElementRegistry((state) => state.loadCard);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHoveringActive, setIsHoveringActive] = useState(false);

  const nextCard = () => setActiveIndex((prev) => (prev + 1) % cards.length);
  const prevCard = () =>
    setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 60,
        right: 60,
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
        const zIndex = isActive ? 100 : cards.length - offsetFromActive;

        return (
          <motion.div
            key={card.id}
            onMouseEnter={() => isActive && setIsHoveringActive(true)}
            onMouseLeave={() => isActive && setIsHoveringActive(false)}
            animate={isActive ? "active" : "stacked"}
            variants={{
              stacked: {
                x: 0 + offsetFromActive * 2,
                y: 0 - offsetFromActive * 2,
                scale: 0.9,
                rotate: offsetFromActive * 2,
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
              bottom: 0,
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
              {isActive && isHoveringActive && (
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
                    onClick={() => loadCard(card.elements, card.id)}
                  />
                  <ActionButton
                    icon={<Delete style={{ fontSize: 14 }} />}
                    color="#ef4444"
                    onClick={() => removeCard(card.id)}
                  />
                  <ActionButton
                    icon={<Download style={{ fontSize: 14 }} />}
                    color="#0e9e0c"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.download = `${card.id}.png`;
                      link.href = card.imgUrl;
                      link.click();
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
        <ControlButton
          icon={<Download />}
          onClick={() => {
            const jsonString = JSON.stringify(cards, null, 2);

            const blob = new Blob([jsonString], { type: "application/json" });

            const href = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = href;
            link.download = "cards_data.json"; // Name of the file

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(href);
          }}
        />
        <UploadButton onUpload={(data) => loadFile(data)} icon={<Upload />} />
        <ControlButton onClick={prevCard} label="Prev" icon={<ChevronLeft />} />
        <ControlButton
          onClick={nextCard}
          label="Next"
          icon={<ChevronRight />}
        />
      </div>
    </div>
  );
};

// Define the props interface
interface UploadButtonProps<T> {
  onUpload: (data: T) => void;
  icon: React.ReactNode;
  // Allows for extra ControlButton props like 'title' or 'className'
  [key: string]: unknown;
}

/**
 * A reusable component that triggers a file upload via a hidden input.
 * @template T The expected type of the JSON data.
 */
function UploadButton<T>({ onUpload, icon, ...props }: UploadButtonProps<T>) {
  // Explicitly type the ref for an HTMLInputElement
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const result = e.target?.result;
        if (typeof result === "string") {
          const json = JSON.parse(result) as T;
          onUpload(json);
        }
      } catch (err) {
        console.error("Failed to parse JSON:", err);
        alert("Invalid JSON file format.");
      }
    };

    reader.readAsText(file);

    // Reset the input value so the same file can be re-uploaded if modified
    event.target.value = "";
  };

  return (
    <>
      <ControlButton
        {...props}
        icon={icon}
        onClick={() => fileInputRef.current?.click()}
      />
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="application/json"
        onChange={handleFileChange}
      />
    </>
  );
}

export default UploadButton;

// --- HELPER COMPONENTS ---

const ActionButton = ({
  icon,
  color,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={(e) => {
      e.stopPropagation(); // Prevent card clicks
      onClick();
    }}
    disabled={disabled}
    style={{
      background: color,
      color: "white",
      border: "none",
      borderRadius: "4px",
      width: "24px",
      height: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    }}
  >
    {icon}
  </motion.button>
);

const ControlButton = ({ onClick, icon, label }: ControlButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    style={{
      background: "#222",
      color: "white",
      border: "none",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    }}
    aria-label={label}
  >
    {icon}
  </motion.button>
);

interface ControlButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  label?: string;
  icon: React.ReactNode;
}
