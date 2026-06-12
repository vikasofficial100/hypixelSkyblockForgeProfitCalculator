import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { PORT, REFRESH_INTERVAL_MS } from './config/constants.js';
import forgeRoutes from './routes/forgeRoutes.js';
import { runFullRefresh } from './services/forgeService.js';

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET"]
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Mount API
app.use('/api/forge', forgeRoutes);


//CRASH HANDLING
app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Backend running on Port ${PORT}`);
  // Run first refresh immediately on startup
  runFullRefresh().catch(err => console.error('Initial refresh failed:', err));
  // Schedule periodic refresh
  setInterval(() => {
    console.log('Scheduled refresh starting...');
    runFullRefresh().catch(err => console.error('Scheduled refresh failed:', err));
  }, REFRESH_INTERVAL_MS);
});


