import express, { Router } from 'express';
import cars from './cars';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/cars',
    route: cars,
  },
];

router.get('/', (_req, res) => res.send(JSON.stringify(Date.now())))

defaultRoutes.map(({ path, route }) => router.use(path, route));

export const apiRouter: Router = router;