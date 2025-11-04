require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const keep_alive = require('./src/keep_alive.js');

const client = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
   ],
});

client.once('ready', () => {
   console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
   if (message.author.bot) return;

   if (message.content === '!ping') {
      message.channel.send('🏓 Pong!');
   }

   if (message.content === '!hello') {
      message.channel.send(`👋 Xin chào ${message.author.username}!`);
   }
});

client.login(process.env.TOKEN);
