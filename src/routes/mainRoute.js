import express from 'express';

const appRouter = express.Router();

appRouter.get('/', (req, res) => res.status(200).send('Discord Bot is running...'));

export default appRouter;
