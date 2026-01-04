import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import addressTagsRoutes from './routes/tags';
import analysisRoutes from './routes/analysis';

const app = express();

app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5175"],
    credentials: true
}));

app.use(bodyParser.json());

// Routes
app.use('/api/address-tags', addressTagsRoutes);
app.use('/api/token-filter-analysis', analysisRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

export default app;
