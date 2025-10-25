import type { Request, Response } from "express";
import {
  Decrypt,
  createOrder,
  generateRandomString,
  generateResponse,
} from "../helpers/index";
import buyNowModel from "../middlewares/index";

const home = async (req: Request, res: Response): Promise<any> => {
  try {
    return res.status(200).send({
      success: true,
      message: "Please use another route!!",
    });
  } catch (error: any) {
    return res.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

const buyNow = async (req: Request, res: Response): Promise<any> => {
  try {
    const data = await req.body;
    try {
      const body = await buyNowModel.validate(data, {
        abortEarly: false,
        strict: true,
      });
      const {
        shippingAddress,
        billingAddress,
        lineItems,
        email,
        note,
        tags = [],
      } = body as any;
      const currency = "INR",
        discountCodes: any = [];
      if (!shippingAddress || !billingAddress) {
        return res.status(200).send({
          success: false,
          error: "Provide shippingAddress and billingAddress",
        });
      }
      if (!Array.isArray(lineItems) || lineItems.length === 0) {
        return res.status(200).send({
          success: false,
          error: "Missing lineItems",
        });
      }
      const shippingCharge = { title: "Prepaid", price: 0 };
      const preparedLineItems = lineItems.map((li: any) => ({
        variantId: li.variantId,
        quantity: li.quantity || 1,
        price: li.price, // optional: include price for custom items
      }));
      const order = await createOrder({
        email,
        lineItems: preparedLineItems,
        shippingAddress,
        billingAddress,
        note,
        tags: [...tags, "Custom Order"],
        discountCodes,
        shippingCharge,
        currency,
        markAsPaid: true,
      });
      return res.send({
        success: true,
        shopifyOrderId: order.id,
        message: "COD order created; payment pending on delivery",
      });
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        message:
          error?.errors[0] || "Error occurred while processing your request!!",
        error: error?.errors || error.message || error,
      });
    }
  } catch (err: any) {
    console.error("buyNow error:", err);
    return res.status(500).send({ success: false, error: err.message });
  }
};

const verifyOtpAttempts: any = {};

const orderCreate = async (req: Request, res: Response): Promise<any> => {
  try {
    const ip = req.ip;
    const now = Date.now();
    const userkey: any = ip;
    const { data } = req.body;
    const { sealvalue, key } = await req.headers;
    const Key = generateRandomString(32);
    if (!verifyOtpAttempts[userkey]) {
      verifyOtpAttempts[userkey] = {
        count: 0,
        firstAttempt: now,
        blockedUntil: null,
      };
    }
    const user = verifyOtpAttempts[userkey];
    if (user.blockedUntil && now < user.blockedUntil) {
      const waitSec = Math.ceil((user.blockedUntil - now) / 1000);
      return res.status(429).send(
        generateResponse(
          {
            error: `Too many attempts. Try again after ${waitSec} seconds.`,
          },
          Key
        )
      );
    }
    if (now - user.firstAttempt > 60 * 1000) {
      user.count = 0;
      user.firstAttempt = now;
    }
    user.count++;
    if (user.count > 5) {
      user.blockedUntil = now + 5 * 60 * 1000;
      return res.status(429).send(
        generateResponse(
          {
            error: "Too many attempts!!",
          },
          Key
        )
      );
    }
    if (!sealvalue || sealvalue === "") {
      return res
        .status(200)
        .send(
          generateResponse(
            { success: false, message: "Seal Value is mandatory" },
            Key
          )
        );
    }
    if (!key || key === "") {
      return res
        .status(200)
        .send(
          generateResponse({ success: false, message: "Key is mandatory" }, Key)
        );
    }
    if (!data || data === "") {
      return res
        .status(200)
        .send(
          generateResponse(
            { success: false, message: "Data is mandatory" },
            Key
          )
        );
    }
    const decData = await Decrypt(data, key);
    try {
      const body = await buyNowModel.validate(decData, {
        abortEarly: false,
        strict: true,
      });
      const {
        shippingAddress,
        billingAddress,
        lineItems,
        email,
        note,
        tags = [],
      } = body as any;
      const currency = "INR",
        discountCodes: any = [];
      if (!shippingAddress || !billingAddress) {
        return res.status(200).send(
          generateResponse(
            {
              success: false,
              error: "Provide shippingAddress and billingAddress",
            },
            Key
          )
        );
      }
      if (!Array.isArray(lineItems) || lineItems.length === 0) {
        return res.status(200).send(
          generateResponse(
            {
              success: false,
              error: "Missing lineItems",
            },
            Key
          )
        );
      }
      const shippingCharge = { title: "Prepaid", price: 0 };
      const preparedLineItems = lineItems.map((li: any) => ({
        variantId: li.variantId,
        quantity: li.quantity || 1,
        price: li.price, // optional: include price for custom items
      }));
      const order = await createOrder({
        email,
        lineItems: preparedLineItems,
        shippingAddress,
        billingAddress,
        note,
        tags: [...tags, "Custom Order"],
        discountCodes,
        shippingCharge,
        currency,
        markAsPaid: true,
      });
      return res.status(200).send(
        generateResponse(
          {
            success: true,
            shopifyOrderId: order.id,
            message: "Order created successfully!!",
          },
          Key
        )
      );
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        message:
          error?.errors[0] || "Error occurred while processing your request!!",
        error: error?.errors || error.message || error,
      });
    }
  } catch (err: any) {
    const Key = generateRandomString(32);
    console.error("buyNow error:", err);
    return res.status(500).send(
      generateResponse(
        {
          success: false,
          message: "Internal Server Error",
          error: err.message,
        },
        Key
      )
    );
  }
};

export { home, buyNow, orderCreate };
