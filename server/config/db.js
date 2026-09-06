const mongoose = require('mongoose');

let warnedOnce = false;

const connectDB = async (retries = 5) => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("Aviso: MONGO_URI não encontrado no .env. Configure o MongoDB para usar o Clicktube.");
    return;
  }
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`MongoDB Conectado: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`Erro ao conectar ao MongoDB (tentativa ${attempt}/${retries}): ${error.message}`);
      if (attempt === retries) {
        // Do NOT exit: keep the HTTP server alive so /health keeps
        // responding and Render doesn't mark the service as crashed.
        // API routes will return 500 until the DB is reachable.
        if (!warnedOnce) {
          console.error('MongoDB indisponível — servidor continua no ar aguardando conexão.');
          warnedOnce = true;
        }
        return;
      }
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
};

module.exports = connectDB;
