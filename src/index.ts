import express, { Application, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import orderRouter from "./buyNow/routes/index";
import helmet from "helmet";

const app: Application = express();

dotenv.config();

const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE"],
  })
);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.removeHeader("Server");
  next();
});

app.disable("x-powered-by");

app.use(
  (
    err: SyntaxError & { status?: number },
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (err instanceof SyntaxError && "body" in err) {
      res.status(400).json({
        success: false,
        message: "Invalid JSON format. Please check your request body.",
      });
    } else {
      next(err);
    }
  }
);

app.use(
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  })
);

app.get("/", async (req: Request, res: Response): Promise<any> => {
  try {
    return res.status(200).send({
      success: true,
      message: "Welcome to mjt services!!",
    });
  } catch (error: any) {
    return res.status(500).send({
      success: false,
      error: error.message,
    });
  }
});

app.post("/", async (req: Request, res: Response): Promise<any> => {
  try {
    return res.status(200).send({
      success: true,
      message: "Welcome to mjt services!!",
    });
  } catch (error: any) {
    return res.status(500).send({
      success: false,
      error: error.message,
    });
  }
});

app.use("/mjt", orderRouter);

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
