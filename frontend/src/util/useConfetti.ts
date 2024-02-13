import JSConfetti from "js-confetti";
import { useEffect, useState } from "react"
import { Nullable } from "../types";

export const useConfetti = (): Nullable<JSConfetti> => {
  const [confetti, setConfetti] = useState<Nullable<JSConfetti>>(null);
  useEffect(() => {
    const jsConfettiInstance = new JSConfetti();
    setConfetti(jsConfettiInstance);
    return () => confetti?.destroyCanvas();
  }, [])

  return confetti;
}