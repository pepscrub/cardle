/* eslint-disable react-hooks/rules-of-hooks */
import { Card, CssBaseline, Fab, ThemeProvider, Tooltip, Typography, createTheme, Paper, useMediaQuery, LinearProgress, Box, TextField } from "@mui/material";
import axios from "axios"
import { Dispatch, FC, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import usePromise from "react-use-promise"
import useLocalStorage from "use-local-storage";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ImageIcon from '@mui/icons-material/Image';
import InfoIcon from '@mui/icons-material/Info';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DeleteIcon from '@mui/icons-material/Delete';

interface GameData {
  x: number;
  y: number;
  width: number;
  height: number;
}

const entries = 31661;

const CanvasImageRender: FC<{ link?: string, setGameData: Dispatch<SetStateAction<GameData[]>> }> = ({ link, setGameData }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [startX, setStartX] = useState<number>(0);
  const [startY, setStartY] = useState<number>(0);
  const [width, setWidth] = useState<number>(100);
  const [height, setHeight] = useState<number>(100);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });

    if (!canvas || !ctx || !link) return;


    const image = new Image();
    image.src = link;

    image.onload = () => {
      canvas.width = 1920;
      canvas.height = 1080;
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Fit image to 1920/1080 resolution and aspect ratio
      const wRatio = canvas.width / image.width;
      const hRatio = canvas.height / image.height;
      const ratio = Math.min(wRatio, hRatio);
      const x = (canvas.width - image.width * ratio) / 2;
      const y = (canvas.height - image.height * ratio) / 2;

      // Clear image drawn
      ctx.drawImage(image, 0, 0, image.width, image.height, x, y, image.width * ratio, image.height * ratio)
    }
  }, [link])

  const drawRectangle = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (canvas && context) {
      context.strokeStyle = 'red';
      context.lineWidth = 2;
      context.strokeRect(startX, startY, width, height);
      const gameData = { x: startX, y: startY, width, height, imgUrl: link };
      setGameData((prev) => [...prev, gameData]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!e.shiftKey) return;
    setStartX(e.nativeEvent.offsetX);
    setStartY(e.nativeEvent.offsetY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!e.shiftKey) return;
    const currentX = e.nativeEvent.offsetX;
    const currentY = e.nativeEvent.offsetY;

    setWidth(currentX - startX);
    setHeight(currentY - startY);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!e.shiftKey) return;
    drawRectangle();
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      width="1920"
      height="1080"
    />
  );
}

const App = () => {
  const [id, setId] = useLocalStorage('id', 0);
  const [gameData, setGameData] = useState<GameData[]>([]);
  const [pages, setPages] = useState(0);
  const [searchModel, setSearchModel] = useState(false);

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );

  const [car] = usePromise(async () => {
    const { data } = await axios.get(`http://localhost:8080/api/v1/cars/${id}`)
    return data[0];
  }, [id]);

  const [page, setPage] = useState(false);

  const getClass = () => {
    if (!car || !searchModel) return ''
    switch (car.vclass) {
      case 'Compact Cars': return 'hatchback'
      default: car.vclass;
    }
  }

  const deleteEntry = async () => {
    await axios.delete(`http://localhost:8080/api/v1/cars/${id}`, { data: car });
    setGameData([]);
    setId((prev) => (prev ?? 0) + 1)
    setPages(0);
  }

  const [search, setSearch] = useState('');

  const [images] = usePromise<string[]>(async () => {
    if (!car) return Promise.resolve();
    const vClass = getClass();
    const cleanedSearch = search.replace(/\//gmi, "%2F")
    const data = !page
      ? (await axios.get(`http://localhost:8080/api/v1/cars/getImages/${cleanedSearch} ${vClass}`)).data.links
      : (await axios.get(`https://www.googleapis.com/customsearch/v1?key=AIzaSyAHrxG0tVCWYxuVCEr687KG-V9bLNWK0LA&cx=013031014986252904024:vnjtgx5lwxi&q=${search} ${vClass}&searchType=image&start=${pages}`)).data.items.map(({ link }: { link: string }) => link)
    return data
  }, [car, page, pages, search]);

  const updateEntry = async () => {
    try {
      if (!gameData.length) return;
      await axios.post(`http://localhost:8080/api/v1/cars/${id}`, gameData, {
        headers: {
          'content-type': 'application/json',
        },
      });
    } catch (err) {
      // Eat error
    } finally {
      console.log('No game data', !gameData.length);
      setGameData([]);
      setId((prev) => (prev ?? 0) + 1)
      setPages(0);
    }
  }

  useEffect(() => {
    if (!car) return;
    setSearch(`${car.year} ${car.make} ${car.model} ${getClass()}`)
  }, [car]);

  return (
    <ThemeProvider theme={theme}>
      <Paper sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'fixed', left: 0, top: 0, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress variant="determinate" value={(id / entries) * 100}/>
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">{`${Math.round((id / entries) * 100)}%`}</Typography>
          </Box>
        </Box>
        <TextField
          label="Car"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: '100%',textAlign: 'center', mt: 3, zIndex: 99999 }}
        />
      </Paper>
      <CssBaseline />
      <Card sx={{ width: "100%" }}>
        {images?.map((image) => <>
          <Typography variant="h4">{image.split('/')[2]}</Typography>
          <CanvasImageRender key={image} link={image} setGameData={setGameData} />
        </>)}
      </Card>
      <Fab
        color={searchModel ? "success" : "error"}
        onClick={deleteEntry}
        sx={{
          position: 'fixed',
          top: '10rem',
          right: '2rem',
        }}
      >
        <DeleteIcon />
      </Fab>
      <Fab
        color={searchModel ? "success" : "error"}
        onClick={() => setSearchModel((prev) => !prev)}
        sx={{
          position: 'fixed',
          bottom: '14rem',
          right: '2rem',
        }}
      >
        <DirectionsCarIcon />
      </Fab>
      <Fab
        color="secondary"
        aria-label="next"
        onClick={() => setPage((prev) => !prev)}
        sx={{
          position: 'fixed',
          bottom: '6rem',
          right: '2rem',
        }}
      >
        <Tooltip title={!page ? 'Switch to Google' : 'Switch to Wikipedia'}>
          {!page ? <InfoIcon /> : <ImageIcon />}
        </Tooltip>
      </Fab>
      <Fab
        color="warning"
        onClick={() => setPages((prev) => prev + 10)}
        sx={{
          position: 'fixed',
          bottom: '10rem',
          right: '2rem',
        }}
      >
        <ArrowForwardIosIcon />
      </Fab>
      <Fab
        color="primary"
        aria-label="next"
        onClick={updateEntry}
        sx={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
        }}
      >
        <ArrowForwardIosIcon />
      </Fab>
    </ThemeProvider>
  )
}

export default App
