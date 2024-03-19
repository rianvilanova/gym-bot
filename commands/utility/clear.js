const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Limpa mensagens de um canal'),
	async execute(interaction) {
        const fetched = await interaction.channel.messages.fetch();
        await interaction.channel.bulkDelete(fetched)
        const msg = await interaction.reply('Mensagens limpas.')
		setTimeout(() => {
			msg.delete();
		}, 1000)
	},
};