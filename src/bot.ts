import { Client, GatewayIntentBits } from 'discord.js';
import { helloCommand } from "./commands/hello";
import * as dotenv from 'dotenv';
import { readdir, readFile, writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path'
import path from 'path'

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

async function ensureDataFileExists() {
    const dir = path.dirname(dataFilePath)
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true }); // Cria o diretório se não existir
    }
    if (!existsSync(dataFilePath)) {
        // Cria o arquivo com conteúdo padrão se não existir
        await writeFile(dataFilePath, JSON.stringify({ userCommandCounts: {} }, null, 2));
    }
}

async function loadCommands() {
    const commandsDir = join(__dirname, 'commands');
    const files = await readdir(commandsDir);
        try{
            for (const file of files) {
                if (file.startsWith('.ts')) {
                const command = await import(join(commandsDir, file))
                
                if (command.pingCommand) {
                    commands[command.pingCommand.name] = command.pingCommand;
                }
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
    await ensureDataFileExists()
    try {
        const data = await readFile(dataFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao ler o arquivo de dados:', error);
        return { userCommandCounts: {} }; // Retorne um objeto padrão se houver erro
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

    if (!data.userCommandCounts) {
        data.userCommandCounts = {};
    }
    if (!data.userCommandCounts[userId]) {
        data.userCommandCounts[userId] = {};
    }
    if (!data.userCommandCounts[userId][commandName]) {
        data.userCommandCounts[userId][commandName] = 0;
    }

    data.userCommandCounts[userId][commandName]++;
    console.log(`Atualizando contagem: Usuário: ${userId}, Comando: ${commandName}, Contagem: ${data.userCommandCounts[userId][commandName]}`);
    await writeData(data);
}

client.once('ready', async () => {
    console.log(`bot Logado ${client.user?.tag}`);
    await loadCommands();
})
client.on('messageCreate', async (message) => {
    if(message.author.bot) return;

    if(!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase()
    if (commandName === helloCommand.name) {
        await helloCommand.execute(message)
    }
    await updateCommandCount(message.author.id, helloCommand.name);
    
})
client.login(process.env.TOKEN)