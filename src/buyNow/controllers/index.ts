import type { Request, Response } from "express";
import { createOrder, getCustomerAddress } from "../helpers/index";

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
    const {
      customerId,
      shippingAddress,
      billingAddress,
      lineItems,
      email,
      note,
      tags = [],
      discountCodes = [],
      paymentMethod,
      currency = "INR",
    } = req.body as any;

    // Validation
    if (!customerId)
      return res
        .status(400)
        .json({ success: false, error: "Missing customerId" });
    if (!shippingAddress || !billingAddress)
      return res.status(400).json({
        success: false,
        error: "Provide shippingAddress and billingAddress",
      });
    if (!Array.isArray(lineItems) || lineItems.length === 0)
      return res
        .status(400)
        .json({ success: false, error: "Missing lineItems" });
    if (!["COD", "ONLINE"].includes(paymentMethod))
      return res
        .status(400)
        .json({ success: false, error: "Invalid paymentMethod" });

    const shippingCharge = { title: "Prepaid", price: 150 };

    const preparedLineItems = lineItems.map((li: any) => ({
      variantId: li.variantId,
      quantity: li.quantity || 1,
      price: li.price, // optional: include price for custom items
    }));

    if (paymentMethod === "COD") {
      const order = await createOrder({
        customerId,
        email,
        lineItems: preparedLineItems,
        shippingAddress,
        billingAddress,
        note,
        tags: [...tags, "COD"],
        discountCodes,
        shippingCharge,
        currency,
        markAsPaid: false,
      });

      return res.json({
        success: true,
        shopifyOrderId: order.id,
        message: "COD order created; payment pending on delivery",
      });
    }

    // ONLINE payment
    const order = await createOrder({
      customerId,
      email,
      lineItems: preparedLineItems,
      shippingAddress,
      billingAddress,
      note,
      tags: [...tags, "PREPAID"],
      shippingCharge,
      currency,
      markAsPaid: true,
    });

    return res.json({
      success: true,
      shopifyOrderId: order.id,
      message: "Order created",
    });
  } catch (err: any) {
    console.error("buyNow error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export { home, buyNow };
