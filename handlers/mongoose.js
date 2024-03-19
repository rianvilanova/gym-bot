const { MongoClient } = require('mongodb');
const { mongoURL } = require(`../config.json`);

const mongo = new MongoClient(mongoURL);	

async function connectMongo() {
    if (!mongoURL) return;

		await mongo.connect();

		if (mongo.connect) {
			console.log('[BANCO DE DADOS] Conectado ao MongoDB')
		} else {
			console.log('[BANCO DE DADOS] Erro ao conectar com o MongoDB')
	}
}

async function inserirDocumento(documento) {
    try {
        const db = mongo.db('gym');
        const collection = db.collection('treinos');
        await collection.insertOne(documento);
    } catch (error) {
        console.log(error)
    }
}

module.exports = { connectMongo, inserirDocumento, mongo };