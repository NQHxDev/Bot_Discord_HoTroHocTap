import express from 'express';

const appRouter = express.Router();

appRouter.get('/', (req, res) => res.send('Discord Bot is running...'));

export default appRouter;
