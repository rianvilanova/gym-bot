const { Client, Collection, GatewayIntentBits, IntentsBitField, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');

const fs = require('node:fs');
const path = require('node:path');

const client = new Client({ intents: [GatewayIntentBits.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// sistema gym
const trainingSchema = require('./schemas/training');
const { inserirDocumento }= require('./handlers/mongoose');

let sistemaAtivo = false;
let diaDeTreinoAtual = '';
let indiceExercicioAtual = 0;

client.on('messageCreate', (message) => {
	if (message.author.bot) return;

	if (sistemaAtivo && message.content.startsWith("start")) { 
		const args = message.content.split(' ');
		const diaTreino = args[1].toLowerCase();
		if (!trainingSchema[diaTreino]) {
			message.channel.send('Dia de treino inválido. Utilize segunda, terca, quarta, quinta, sexta ou sabado.');
			return;
		}
		indiceExercicioAtual = 0;
		diaDeTreinoAtual = diaTreino;
		message.channel.send(`Dia de treino ${diaTreino} iniciado. Formato: repetições, peso`)
		return;
	}

	if (sistemaAtivo && diaDeTreinoAtual && /^\d+, \d+$/.test(message.content)) {
		const [repeticoes, peso] = message.content.split(',').map(value => parseInt(value.trim()));

        if (isNaN(repeticoes) || isNaN(peso)) {
            message.channel.send('Formato de mensagem inválido. Use o formato repetições, peso.');
            return;
        }

		const exerciciosDiaAtual = Object.keys(trainingSchema[diaDeTreinoAtual]);

		if (indiceExercicioAtual >= exerciciosDiaAtual.length) {
            message.channel.send('Todos os exercícios já foram associados.');
            return;
        }

		const nomeExercicio = exerciciosDiaAtual[indiceExercicioAtual];
		const exercicioAtual = trainingSchema[diaDeTreinoAtual][nomeExercicio];

		if (exercicioAtual.repeticoes.length >= exercicioAtual.series) {
            // Passar para o próximo exercício
            indiceExercicioAtual++;
            if (indiceExercicioAtual >= exerciciosDiaAtual.length) {
                message.channel.send('Todos os exercícios já foram associados.');
                return;
            }
            const proximoExercicio = exerciciosDiaAtual[indiceExercicioAtual];
            message.channel.send(`Séries do exercício ${nomeExercicio} completas. Próximo exercício: ${proximoExercicio}.`);
            return;
        }

		trainingSchema[diaDeTreinoAtual][nomeExercicio].repeticoes.push(repeticoes);
		trainingSchema[diaDeTreinoAtual][nomeExercicio].peso.push(peso);

		if (exercicioAtual.repeticoes.length === exercicioAtual.series) {
            // Passar para o próximo exercício
            indiceExercicioAtual++;
            if (indiceExercicioAtual >= exerciciosDiaAtual.length) {
                message.channel.send('Todos os exercícios já foram associados.');
                return;
            }
            const proximoExercicio = exerciciosDiaAtual[indiceExercicioAtual];
            message.channel.send(`Séries do exercício ${nomeExercicio} completas. Próximo exercício: ${proximoExercicio}.`);
        } else {
            // Informar que a série foi adicionada
            const serieAtual = exercicioAtual.repeticoes.length;
            message.channel.send(`Série ${serieAtual} do exercício ${nomeExercicio} adicionada.`);
        }
		return;
	}

	if (message.content === '!start') {
		sistemaAtivo = true;
        diaTreinoAtual = '';
        indiceExercicioAtual = 0; // Reiniciar o índice do exercício
        message.channel.send('Sistema de treino ativado. Use start (dia do treino) para iniciar um novo dia de treino.');
	}

	const dataAtual = new Date();
	const dia = dataAtual.getDate();
	const mes = dataAtual.getMonth() + 1;
	const ano = dataAtual.getFullYear();

	if (message.content === '!stop' || message.content === 'terminar') {		
		let treinoAtual = trainingSchema[diaDeTreinoAtual];
		let newObj = {
			diaDaSemana: diaDeTreinoAtual,
			treino: trainingSchema[diaDeTreinoAtual],
			data: `${dia}/${mes}/${ano}`
		}

		let strModel = `Esse foi o seu treino de hoje:`;

		for (let exercicios in treinoAtual) {
			strModel += `\n${exercicios}:`;

			for (let i = 0; i < treinoAtual[exercicios]['repeticoes'].length; i++) {
				strModel += `\n${i + 1}. ${treinoAtual[exercicios]['repeticoes'][i]} reps, ${treinoAtual[exercicios]['peso'][i]}kg,`;
				if (i === treinoAtual[exercicios]['repeticoes'].length) {
					strModel += `\n\n`;
				}
			}
		}
		strModel+= `\nData: ${dia}/${mes}/${ano}`;
		message.channel.send(strModel)
		inserirDocumento(newObj)

		sistemaAtivo = false;
		diaDeTreinoAtual = '';
		indiceExercicioAtual = 0;
		return;
	}
	
})
// Fim

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[AVISO] O comando no diretório ${filePath} está faltando "data" ou "execute".`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(token);