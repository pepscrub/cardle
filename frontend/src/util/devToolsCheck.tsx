import devtools from 'devtools-detect';
import { useSnackbar } from "notistack";
import { FC, useEffect } from "react";
import { Emojis } from "../components/constants";
import { useConfetti } from "./useConfetti";

export const DevChecker: FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const jsConfetti = useConfetti();

  useEffect(() => {
    window.addEventListener('devtoolschange', () => {
      if (!devtools.isOpen) {
        enqueueSnackbar('CHEATER CHEATER PUMPKIN EATER', { variant: 'warning', preventDuplicate: true });
        console.clear();
        console.log('%cHaving a look around? If you find any bugs, report them to %cbrendan@freeman.dev', 'font-family: "Fira Code", monospace;', 'font-family: "Roboto", sans-serif; font-weight: 800; color: #34bacf;');
        jsConfetti?.addConfetti({
          emojis: Emojis.cheater,
       });
      }
    })
    return () => window.removeEventListener('devtoolschange', () => {});
  }, [jsConfetti]);

  return null;
}