const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn("Aviso: MONGO_URI não encontrado no .env. Configure o MongoDB para usar o Clicktube.");
      return;
    }
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
