// src/routes/orderRoutes.ts
import { Router } from "express";
import { buyNow } from "../controllers/index.js";
const orderRouter = Router();
orderRouter.post("/buyNow", buyNow);
export default orderRouter;
