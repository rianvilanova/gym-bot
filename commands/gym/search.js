const { SlashCommandBuilder } = require('discord.js');
const mongooseHandler = require('../../handlers/mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Mostra todos os ultimos treinos de um determinado dia (segunda, terca etc)')
        .addStringOption(option => option.setName('dia').setDescription('Dia da semana').setRequired(true)),
    async execute(interaction) {
        const { options } = interaction;
        const dia = options.getString('dia');

        const db = mongooseHandler.mongo.db('gym');
        const treinos = db.collection('treinos');

        const query = { diaDaSemana: dia };

        const documento = await treinos.find(query).toArray();
        
        let strModel = ``;

        for (let i = 0; i < documento.length; i++) {
            let treinoObj = documento[i]['treino'];
            for (let exercicio in treinoObj) {
                strModel += `\n**${exercicio}:**`

                for (let j = 0; j < treinoObj[exercicio]['repeticoes'].length; j++) {
                    strModel += `\n${j+1}. ${treinoObj[exercicio]['repeticoes'][j]} reps, ${treinoObj[exercicio]['peso'][j]}kg,`
                }
            }
            strModel += `\n\n${documento[i]['data']}`;
            
        }

        interaction.channel.send(strModel)

    }
}