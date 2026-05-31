import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes';
import tacticalRoutes from './routes/tactical.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/tactical', tacticalRoutes);

export default app;
