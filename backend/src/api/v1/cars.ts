import { collection, gameCollection, setGameDay } from "@src/server";
import express from "express";
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import axios from "axios";
import * as cheerio from 'cheerio';
import { Car } from "@src/types/cars";

const router = express.Router();

router.get('/makes', async (_req, res) => {
  const data = await collection.aggregate([
    { $group: { _id: "$make", data: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$data" } }
  ]).toArray();
  res.send(data.map(({make}) => make));
})

router.get('/getImages/:query', async (req, res) => {
  const query = req.params.query
  const { data } = await axios.get(`https://commons.wikimedia.org/w/index.php?search=${query}&title=Special:MediaSearch&go=Go&type=image&format=json`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    }
  });

  const links: string[] = [];
  const htmlDoc = cheerio.load(data)
  const anchors = htmlDoc('img.sd-image');
  anchors.map((_i, element) => {
    const link = element.attribs.src as string;
    links.push(
      link
        .replace('/thumb', '')
        .replace(/\/(?:.(?!\/))+$/, '')
    );
  })

  console.log(links)

  res.send({ links });
})

router.get('/models/:make', async (req, res) => {
  const data = await collection.aggregate([
    { $match: { make: req.params.make, } },
    { $group: { _id: "$model", make: { $first: "$model" }, data: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: { $mergeObjects: ["$data", { make: "$make" }] } } }
  ]).toArray();
  res.send(data.map(({make}) => make));
})

router.get('/todaysGame', async (_req, res) => {
  const start = new Date().setHours(0,0,0,0);
  const end = new Date().setHours(23,59,59,999);
  const todaysGame = await gameCollection.findOne({ day: { "$gte": start, "$lt": end } });
  if (!todaysGame) {
    const game = await setGameDay();
    return res.send(game);
  }
  const randomEntry = await collection.findOne({ index: todaysGame?.index });
  return res.send({ ...randomEntry, resetRegion: Intl.DateTimeFormat().resolvedOptions().timeZone });
})

router.delete('/:index', async (req, res) => {
  const index = Number(req.params.index);
  const { model, make, year } = req.body as Car;
  const containsDuplicates = await collection.find({ model, make, year, index: { "$gte": index } }).toArray();
  if (containsDuplicates.length) {
    const data = await collection.deleteMany({ model, make, year, index: { "$gte": index } });
    res.send(data);
    return;
  }
  const data = await collection.deleteOne({ index });
  res.send(data);
})

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const data = await collection.find({ index: Number(id) }).toArray();
  res.send(data);
})

router.post('/:id', async (req, res) => {
  const index = req.params.id;
  const requestBody = req.body;

  if (!requestBody || !requestBody.length) return res.send({ status: 'failed', error: 'no request body' });

  // Function to download and save the file
  const downloadAndSaveFile = async (url: string): Promise<string> => {
    const updatedUrl = url.replace(/\?.*/gmi, '');
    const fileExtension = path.extname(updatedUrl);
    const filename = randomUUID() + fileExtension;
    const filePath = path.join('./imgs/', filename);
    console.log(updatedUrl);
    await axios({
      url: updatedUrl,
      responseType: 'stream',
      method: 'GET',
    }).then(
      response =>
        new Promise((resolve, reject) => {
          response.data
            .pipe(fs.createWriteStream(filePath))
            .on('finish', resolve)
            .on('error', (e: Error) => reject(e));
        }),
    );
    return `/imgs/${filename}`;
  };

  // Update imageUrl and download files
  for (const index of requestBody.keys()) {
    try {
      requestBody[index].imgUrl = await downloadAndSaveFile(requestBody[index].imgUrl);
    } catch (err) {
      requestBody.slice(index, 1);
    }
  }

  const data = await collection.updateOne({ index: Number(index) }, { "$set": { gameData: requestBody } }, { upsert: true });
  res.send({ status: 'success', data });
  return;
})

export default router;