import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express } from 'express';
import helmet from 'helmet';
import { MongoClient, ServerApiVersion } from 'mongodb';
import path from 'path';
import { pino } from 'pino';

import compressFilter from '@common/middleware/compressFilter';
import errorHandler from '@common/middleware/errorHandler';
import rateLimiter from '@common/middleware/rateLimiter';
import requestLogger from '@common/middleware/requestLogger';
// import { getCorsOrigin } from '@common/utils/envConfig';
import { healthCheckRouter } from '@modules/healthCheck/healthCheckRoutes';
import { Car } from './types/cars';
import schedule from 'node-schedule';
import { apiRouter } from './api/v1';
import bodyParser from 'body-parser';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

const logger = pino({ name: 'server start' });
const app: Express = express();
// const corsOrigin = getCorsOrigin();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(compression({ filter: compressFilter }));
app.use(bodyParser())
app.use(rateLimiter);

// Request logging
app.use(requestLogger());

// Routes
app.use('/health-check', healthCheckRouter);
app.use('/api/v1', apiRouter);

// Error handlers
app.use(errorHandler());


// Connecting to mongoDB server
export const mongoClient = new MongoClient(process.env.MONGODB_URL ?? '', {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

mongoClient
  .connect()
  .then(() => logger.info('Connected to mongoDB server'))
  .catch(() => logger.error('Unable to connect to mongoDB server'));

export const db = mongoClient.db(process.env.DB_NAME);
export const gameCollection = db.collection<{ day: number; index: number }>(process.env.COLLECTION_GAME ?? 'cardleGames')
export const collection = db.collection<Car>(process.env.COLLECTION_NAME ?? 'carsMerged');


export const setGameDay = async (): Promise<Car | undefined> => {
  try {
    const start = new Date().setHours(0,0,0,0);
    const end = new Date().setHours(23,59,59,999);
    const isGameSet = await gameCollection.findOne({ day: { "$gte": start, "$lt": end } });
    if (!!isGameSet?._id) throw new Error('Game is already set');

    const totalDocuments = (await collection.find({ gameData: { "$exists": true } }).toArray()).length;
    const randomIndex = Math.floor(Math.random() * totalDocuments);
    const hasPlayed = await gameCollection.findOne({ index: randomIndex });
    const randomDocument = await collection.findOne({ gameData: { "$exists": true } }, { skip: randomIndex });
    if (!!hasPlayed || !randomDocument) return setGameDay(); // Try again

    await gameCollection.insertOne({ day: Date.now(), index: randomDocument.index })
    logger.info('Daily updated completed:', randomDocument);
    return randomDocument;
  }catch (error) {
    if ((error as Error).message !== 'Game is already set') logger.error('Error during daily update:', error);
  }
  return undefined;
}

// Schedule a daily task to update a random entry in the collection
schedule.scheduleJob("*/5 * * * *", setGameDay)

setGameDay();


/**
 * ONLY RUN THIS FUNCTION __ONCE__
 * Updates a mongodb collection with all the data from all-vehicles-model.json
 * NOTE: There are duplicates given the same engine types with different transmissions etc.
 */
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// const populateDatabase = async () => {
//   const result = await collection.insertMany(cars);
//   logger.info(`${result.insertedCount} cars inserted successfully`);
// };

export { app, logger };