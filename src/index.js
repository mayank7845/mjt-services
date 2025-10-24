import express from "express";
import dotenv from "dotenv";
import cors from 'cors';
import orderRouter from './buyNow/routes/index.js';
const app = express();
app.use(express.json());
app.use(cors({
    origin: "*",
}));
dotenv.config();
const PORT = process.env.PORT || 4000;
app.use('/mjt', orderRouter);
app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
});
