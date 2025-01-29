import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { promises as fs } from 'node:fs';
import path from 'node:path'

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
const dataFilePath = path.join(__dirname, 'data', 'data.json');
const commands: { [key: string]: any} = {};

async function loadCommands() {
    const commandsDir = path.join(__dirname, 'commands');
    const files = await fs.readdir(commandsDir);

    for (const file of files) {
        if (file.startsWith('.ts')) {
            const command = await import(path.join(commandsDir, file))
            commands[command.pingCommand.name] = command.pingCommand;
            if (command.helloCommand) {
                commands[command.helloCommand.name] = command.helloCommand;
            }
        }
    }
}

async function readData() {
    try {
        const data = await fs.readFile(dataFilePath, 'utf-8');
        return JSON.parse(data)
    } catch (error) {
        console.error('Erro ao ler o arquivo de dados:', error);
        return { userCommandCounts: {}  }
    }
}

async function writeData(data: any) {
    try {
       await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2))
    } catch (error) {
        console.error('Erro ao escrever no arquivo de dados:', error);
    }
}

async function updateCommandCount(userId: string, commandName: string) {
    const data = await readData()

    if (!data.userCommandCounts[userId]) {
        data.userCommandCounts[userId] = {};
    }
    if (!data.userCommandCounts[userId][commandName]) {
        data.userCommandCounts[userId][commandName] = 0;
    }

    data.userCommandCounts[userId][commandName]++;
    await writeData(data)
}

client.once('ready', async () => {
    console.log(`bot Logado ${client.user?.tag}`);
    await loadCommands();
})
client.on('messageCreate', async (message) => {
    if(message.author.bot) return;

    if(!message.content.startsWith(prefix)) return;

    const commandName = message.content.slice(prefix.length).trim();

    const command = commands[commandName]
    if (command) {
        await command.execute(message)
        await updateCommandCount(message.author.id, commandName)
    }
    
})
client.login(process.env.TOKEN)