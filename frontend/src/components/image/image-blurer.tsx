import { FC, useEffect, useRef } from "react";
import { GameData, Nullable } from "../../types";
import { Box, Fade } from "@mui/material";

interface BlurMap {
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  widthR: number;
  heightR: number;
}

interface Props {
  imageUrls: string[];
  blurRadius: number; // BLUR IN PIXELS
  clearArea: GameData[];
  currentAttempt : number;
  skipBlurring?: boolean;
  maxGuesses: number;
  isLastGuess: boolean;
}

interface BlurImageCanvasProps {
  imageUrl: string;
  blurRadius: number;
  blurMap: Map<string, BlurMap>;
  clearArea: GameData;
  currentAttempt : number;
  skipBlurring?: boolean;
  maxGuesses: number;
  isLastGuess: boolean;
}

const BlurImageCanvas: FC<BlurImageCanvasProps> = ({
  imageUrl,
  blurRadius,
  blurMap,
  clearArea,
  currentAttempt,
  skipBlurring,
}) => {
  const canvasRef = useRef<Nullable<HTMLCanvasElement>>(null);
  // Disable context menu
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    return () => canvas?.removeEventListener('contextmenu', () => {})
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    
    if (!canvas || !ctx) return;
    
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageUrl
    
    image.onload = () => {
      canvas.width = 1920;
      canvas.height = 1080;
      ctx.filter = `none`;

      // Fit image to 1920/1080 resolution and aspect ratio
      const wRatio = canvas.width / image.width;
      const hRatio = canvas.height / image.height;
      const ratio = Math.min(wRatio, hRatio);
      const x = (canvas.width - image.width * ratio) / 2;
      const y = (canvas.height - image.height * ratio) / 2;

      if (!blurMap.get(imageUrl)) {
        blurMap.set(
          imageUrl,
          {
            image,
            x,
            y,
            width: image.width,
            height: image.height,
            widthR: image.width * ratio,
            heightR: image.height * ratio,
          })
      }

      const data =  blurMap.get(imageUrl) ?? ({
        image,
        x,
        y,
        width: image.width,
        height: image.height,
        widthR: image.width * ratio,
        heightR: image.height * ratio,
      });
      
      // Clear image drawn
      ctx.drawImage(data.image, 0, 0, data.width, data.height, data.x, data.y, data.widthR, data.heightR);
      // Blurred image
      const imageData = ctx.getImageData(clearArea.x, clearArea.y, clearArea.width, clearArea.height);
      if (skipBlurring) return;
      // Hole for 'clear image'
      ctx.clearRect(x, y, data.widthR, data.heightR);
      ctx.filter = skipBlurring ? 'none' : `blur(${blurRadius}px)`;
      ctx.drawImage(data.image, 0, 0, data.width, data.height, data.x, data.y, data.widthR, data.heightR)
      ctx.putImageData(imageData, clearArea.x, clearArea.y);
    }

    return () => {
      ctx.filter = 'none'
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, clearArea, blurRadius, canvasRef, currentAttempt, skipBlurring]);

  return <canvas ref={canvasRef} style={{ width: '100%' }}/>;
}

export const BlurImage: FC<Props> = ({
    imageUrls,
    blurRadius,
    clearArea: clearAreaProp,
    currentAttempt,
    skipBlurring,
    maxGuesses,
    isLastGuess,
  }) => {
  const current = currentAttempt <= maxGuesses ? currentAttempt : maxGuesses;
  const blurMap = new Map<string, BlurMap>();

  const blurredImages = () => imageUrls.map((imgUrl, index) => (
    <Fade
      key={`blurred-image-${index}`}
      in={index === current}
      unmountOnExit
      mountOnEnter 
    >
      <Box
        sx={{
          '&': { position: 'absolute !important' },
          width: '1150px',
          top: '50%',
          left: '50%',
          transition: 'transform 125ms linear',
          transform: 'translate(-50%, -50%)',
          '@media screen and (max-width: 600px)': {
            transform: 'translate(-50%, -50%) scale(0.5)'
          },
        }}
      >
        <BlurImageCanvas
          imageUrl={imgUrl}
          blurMap={blurMap}
          blurRadius={blurRadius}
          clearArea={clearAreaProp[index]}
          currentAttempt={current}
          skipBlurring={skipBlurring}
          maxGuesses={maxGuesses}
          isLastGuess={isLastGuess}
        />
      </Box>
    </Fade>
  ))

  return <Box
    sx={{
      transition: 'height 125ms linear',
      height: '40rem',
      '@media screen and (max-width: 600px)': {
        height: '20rem'
      },
      position: 'relative'
    }}
  >
    {blurredImages()}
  </Box>
}