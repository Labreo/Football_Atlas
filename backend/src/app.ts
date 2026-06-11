import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health.routes';
import graniteRoutes from './routes/granite.routes';
import documentRoutes from './routes/document.routes';
import tacticalRoutes from './routes/tactical.routes';
import metricsRoutes from './routes/metrics.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize structured correlation trace mapping for all requests
app.use(requestLogger);

// Mount routing boundaries
app.use('/health', healthRoutes);
app.use('/api/granite', graniteRoutes);
app.use('/api/tactical', tacticalRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/tactical', documentRoutes);

// Global exception catcher boundary
app.use(errorHandler);

export default app;

