import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';

import appRouter from './src/routes/mainRoute.js';
import redisClient from './src/cache/redisClient.js';
import './src/library/rankSystem.js';

import connectionPool from './src/configs/connectDatabase.js';
import { handleMessageServer } from './src/controllers/mainController.js';
import { setDiscordClient } from './src/library/discordClient.js';

const PORT = Number(process.env.PORT) || 3000;
const DISCORD_TOKEN = process.env.TOKEN;

if (!DISCORD_TOKEN) {
   console.error('❌ Missing DISCORD token in environment (process.env.TOKEN). Exiting.');
   process.exit(1);
}

const app = express();
// security / small optimizations
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

// single place to clean up resources
async function shutdown(signal) {
   console.log(`\n🛑 Received ${signal}. Shutting down...`);
   try {
      if (clientServer && clientServer.isReady()) {
         await clientServer.destroy();
         console.log('🔌 Discord client destroyed.');
      }
   } catch (e) {
      console.warn('Error while destroying Discord client:', e);
   }

   try {
      if (redisClient && redisClient.isReady) {
         await redisClient.quit();
         console.log('🔌 Redis client disconnected.');
      }
   } catch (e) {
      console.warn('Error while quitting Redis client:', e);
   }

   try {
      if (connectionPool && connectionPool.end) {
         await connectionPool.end();
         console.log('🔌 Database pool closed.');
      }
   } catch (e) {
      console.warn('Error while closing DB pool:', e);
   }

   process.exit(0);
}

// attach graceful shutdown handlers
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((s) => process.on(s, () => shutdown(s)));

// Init function to ensure ordered startup
async function init() {
   try {
      // 1) Connect / verify DB (if your connectDatabase exposes async connect)
      if (connectionPool && typeof connectionPool.connect === 'function') {
         await connectionPool.connect();
         console.log('🚀 Connected to Database!');
      } else if (connectionPool) {
         // if it's a sync pool, still log presence
         console.log('🚀 Database pool loaded.');
      }

      // 2) Ensure redis is connected (assumes redisClient has .connect())
      if (redisClient && !redisClient.isReady && typeof redisClient.connect === 'function') {
         await redisClient.connect();
         console.log('🚀 Connected to Redis Cloud!');
      } else if (redisClient && redisClient.isReady) {
         console.log('🚀 Redis client is already ready.');
      }

      // 3) Start express server AFTER essential services are ready
      const server = app.listen(PORT, () => {
         console.log(`🌐 Web server running on port ${PORT}...`);
      });

      // 4) Setup discord client events
      clientServer.once('ready', () => {
         const botTag = clientServer.user?.tag ?? 'unknown';
         const [botName] = botTag.split?.('#') ?? [botTag];
         console.log(`🤖 Bot Discord: ${botName} running...`);
      });

      clientServer.on('messageCreate', async (message) => {
         try {
            if (message.author?.bot) return;
            handleMessageServer(message);
         } catch (err) {
            console.error('Error handling message:', err);
         }
      });

      // 5) Login discord (separate try/catch so failure is explicit)
      try {
         await clientServer.login(DISCORD_TOKEN);
         setDiscordClient(clientServer);
         console.log('🔐 Discord login requested...');
      } catch (err) {
         console.error('❌ Failed to login to Discord:', err);
         process.exit(1);
      }
   } catch (err) {
      console.error('Fatal error during startup:', err);
      process.exit(1);
   }
}

// start init immediately
init();
export default clientServer;
