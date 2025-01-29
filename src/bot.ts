import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config()
const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
});
const prefix = 'b@';

client.once('ready', () => {
    console.log(`bot Logado ${client.user?.tag}`);
})
client.on('messageCreate', (message) => {
    if(message.author.bot) return;

    if(!message.content.startsWith(prefix)) return;

    const command = message.content.slice(prefix.length).trim();

    if (command === 'ping') {
        message.channel.send('Pong!')
    }
})
client.login(process.env.TOKEN)