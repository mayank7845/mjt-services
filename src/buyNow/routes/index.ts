import express, { Router } from "express";
import { home, buyNow, orderCreate } from "../controllers/index";

const orderRouter: Router = Router();

orderRouter.use(express.json());

orderRouter.get("/", home);
orderRouter.post("/", home);
orderRouter.post("/order", orderCreate);

export default orderRouter;
