import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';

import appRouter from './src/routes/mainRoute.js';
import redisClient from './src/cache/redisClient.js';
import './src/library/rankSystem.js';

import { testConnection } from './src/configs/connectDatabase.js';
import { handleMessageServer, handleNotification } from './src/controllers/mainController.js';
import { setDiscordClient } from './src/library/discordClient.js';

const isDev = process.env.NODE_ENV === 'development';
const PORT = process.env.PORT || 3000;
const DISCORD_TOKEN = process.env.TOKEN;

if (!DISCORD_TOKEN) {
   console.error('❌ Missing DISCORD token in environment! Exiting...');
   process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', appRouter);

// Create Discord client once
const clientServer = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
   ],
});

async function initServerBot() {
   try {
      const startTime = new Date();
      if (await testConnection()) {
         console.log('🚀 Connected to Database!');
      }

      if (redisClient && !redisClient.isReady && typeof redisClient.connect === 'function') {
         await redisClient.connect();
         console.log('🚀 Connected to Redis Cloud!');
      }

      app.listen(PORT, () => {
         console.log(`🌐 Web server running on port ${PORT}...`);
      });

      clientServer.once('clientReady', async () => {
         const botTag = clientServer.user?.tag ?? 'unknown';
         const [botName] = botTag.split?.('#') ?? [botTag];
         console.log(`\n🤖 Bot Discord: ${botName} running...\n`);

         if (!isDev) await handleNotification(clientServer, redisClient, startTime);
      });

      clientServer.on('messageCreate', async (message) => {
         try {
            if (message.author?.bot) return;
            handleMessageServer(message);
         } catch (err) {
            console.error('Error handling message:', err);
         }
      });

      try {
         await clientServer.login(DISCORD_TOKEN);
         setDiscordClient(clientServer);
         console.log('🔐 Discord login requested...');
      } catch (err) {
         console.error('>> ❌ Failed to login to Discord:', err);
         process.exit(1);
      }
   } catch (err) {
      console.error('Fatal error during startup:', err);
      process.exit(1);
   }
}

initServerBot();
