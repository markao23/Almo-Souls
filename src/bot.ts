import { Client, GatewayIntentBits } from 'discord.js';
import { helloCommand } from "./commands/hello";
import * as dotenv from 'dotenv';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path'

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
const dataFilePath = join(__dirname, 'data', 'data.json');
const commands: { [key: string]: any} = {};

async function loadCommands() {
    const commandsDir = join(__dirname, 'commands');
    const files = await readdir(commandsDir);
        try{
            for (const file of files) {
                if (file.startsWith('.ts')) {
                const command = await import(join(commandsDir, file))
                commands[command.pingCommand.name] = command.pingCommand;
                if (command.helloCommand) {
                    commands[command.helloCommand.name] = command.helloCommand;
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar comandos:', error);
    }
}

async function readData() {
    try {
        const data = await readFile(dataFilePath, 'utf-8');
        return JSON.parse(data)
    } catch (error) {
        console.error('Erro ao ler o arquivo de dados:', error);
        return { userCommandCounts: {}  }
    }
}

async function writeData(data: any) {
    try {
       await writeFile(dataFilePath, JSON.stringify(data, null, 2))
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
client.on('messageCreate', (message) => {
    if(message.author.bot) return;

    if(!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase()
    if (commandName === helloCommand.name) {
        helloCommand.execute(message)
    }
    
})
client.login(process.env.TOKEN)