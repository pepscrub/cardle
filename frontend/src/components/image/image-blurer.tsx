import { FC, useEffect, useRef } from "react";
import { Nullable } from "../../types";

interface Props {
  imageUrl: string;
  blurRadius: number; // BLUR IN PIXELS
  clearArea: {x: number, y: number, width: number, height: number }[];
  currentAttempt : number;
  skipBlurring?: boolean;
}

// const MOSAIC = 10;

export const BlurImage: FC<Props> = ({ imageUrl, blurRadius, clearArea: clearAreaProp, currentAttempt, skipBlurring }) => {
  const canvasRef = useRef<Nullable<HTMLCanvasElement>>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    

    if (!canvas || !ctx) return;
    
    const image = new Image();
    image.crossOrigin = '*';
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

      // Clear image drawn
      ctx.drawImage(image, 0, 0, image.width, image.height, x, y, image.width * ratio, image.height * ratio);
      if (clearAreaProp.length <= currentAttempt) return;
  
      // Blurred image
      const clearArea = clearAreaProp[currentAttempt];
      const imageData = ctx.getImageData(clearArea.x, clearArea.y, clearArea.width, clearArea.height);
      // Hole for 'clear image'
      ctx.clearRect(x, y, image.width * ratio, image.height * ratio);
      ctx.filter = skipBlurring ? 'none' : `blur(${blurRadius}px)`;
      ctx.drawImage(image, 0, 0, image.width, image.height, x, y, image.width * ratio, image.height * ratio)
      ctx.putImageData(imageData, clearArea.x, clearArea.y);
    }

    return () => {
      ctx.filter = 'none'
    };
  }, [imageUrl, clearAreaProp, blurRadius, canvasRef, currentAttempt, skipBlurring]);

  return <canvas ref={canvasRef} style={{ width: '100%' }}/>
}