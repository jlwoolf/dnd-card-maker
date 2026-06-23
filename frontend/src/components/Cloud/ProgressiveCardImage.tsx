import { useCallback, useEffect, useRef, useState } from "react";
import { getCardImageUrl } from "@src/utils/cardImageUrl";

interface ProgressiveCardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  cardId: string;
  highResScale?: number;
  lowResScale?: number;
}

export default function ProgressiveCardImage({
  cardId,
  highResScale = 0.6,
  lowResScale = 0.1,
  style,
  ...rest
}: ProgressiveCardImageProps) {
  const lowSrc = getCardImageUrl(cardId, lowResScale);
  const highSrc = getCardImageUrl(cardId, highResScale);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const targetRef = useRef(highSrc);

  const handleLoad = useCallback((src: string) => {
    if (targetRef.current === src) setLoadedSrc(src);
  }, []);

  useEffect(() => {
    targetRef.current = highSrc;
    const img = new Image();
    img.onload = () => handleLoad(highSrc);
    img.onerror = () => handleLoad("");
    img.src = highSrc;
  }, [highSrc, handleLoad]);

  const showHighRes = loadedSrc === highSrc;

  return (
    <img
      src={showHighRes ? highSrc : lowSrc}
      style={{
        filter: showHighRes ? "blur(0px)" : "blur(10px)",
        transition: "filter 0.4s ease-out",
        ...style,
      }}
      {...rest}
    />
  );
}
