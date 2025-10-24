import express, { Router } from "express";
import { home, buyNow } from "../controllers/index";

const orderRouter: Router = Router();

orderRouter.use(express.json());

orderRouter.get("/", home);
orderRouter.post("/", home);
orderRouter.post("/buyNow", buyNow);

export default orderRouter;
