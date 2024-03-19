const { Events } = require('discord.js');
const { mongoURL } = require('../config.json');

const mongooseHandler = require('../handlers/mongoose');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`[STATUS] Ativo! Logado como ${client.user.tag}`);
		await mongooseHandler.connectMongo();
	},
};