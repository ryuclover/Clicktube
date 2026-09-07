const mongoose = require('mongoose');

let warnedOnce = false;
let lastError = null;
let keepAliveTimer = null;
let isConnecting = false;

const getDbStatus = () => ({
  state: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host || null,
  lastError,
});

const connectDB = async (retries = 5) => {
  if (isConnecting) return;
  isConnecting = true;
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.warn("Aviso: MONGO_URI não encontrado no .env. Configure o MongoDB para usar o Clicktube.");
      return;
    }
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Reuse existing connection if already up
        if (mongoose.connection.readyState === 1) {
          lastError = null;
          warnedOnce = false;
          return;
        }
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 10000,
        });
        lastError = null;
        warnedOnce = false;
        console.log(`MongoDB Conectado: ${conn.connection.host}`);
        return;
      } catch (error) {
        lastError = {
          message: error.message,
          code: error.code || null,
          reason: error.reason ? String(error.reason).slice(0, 300) : null,
          attempt,
          time: new Date().toISOString(),
        };
        console.error(`Erro ao conectar ao MongoDB (tentativa ${attempt}/${retries}): ${error.message}`);
        if (attempt === retries) {
          // Do NOT exit: keep the HTTP server alive so /health keeps
          // responding and Render doesn't mark the service as crashed.
          // API routes will return 503 until the DB is reachable.
          if (!warnedOnce) {
            console.error('MongoDB indisponível — servidor continua no ar aguardando conexão.');
            warnedOnce = true;
          }
          return;
        }
        await new Promise((r) => setTimeout(r, 3000 * attempt));
      }
    }
  } finally {
    isConnecting = false;
  }
};

/**
 * Self-healing loop: if the driver drops (Atlas pause, network blip,
 * credential rotation), retry in the background every 60s without
 * requiring a Render redeploy. Also re-arms on disconnect events.
 */
const startKeepAlive = (intervalMs = 60000) => {
  if (keepAliveTimer) return;
  const tick = async () => {
    if (mongoose.connection.readyState !== 1) {
      console.log('Keep-alive: MongoDB desconectado — tentando reconectar...');
      await connectDB(2);
    }
  };
  keepAliveTimer = setInterval(() => {
    tick().catch((e) => console.error('Keep-alive falhou:', e.message));
  }, intervalMs);
  // Don't keep the process alive just for this timer in tests
  if (keepAliveTimer.unref) keepAliveTimer.unref();
  mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose desconectado — nova tentativa em 10s...');
    setTimeout(() => connectDB(3).catch(() => {}), 10000);
  });
  mongoose.connection.on('reconnected', () => {
    console.log('Mongoose reconectado.');
    lastError = null;
    warnedOnce = false;
  });
};

module.exports = connectDB;
module.exports.getDbStatus = getDbStatus;
module.exports.startKeepAlive = startKeepAlive;
