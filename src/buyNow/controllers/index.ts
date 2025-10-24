import  type { Request, Response } from "express";
import {  completeDraftOrder, createDraftOrder,  getCustomerAddress } from "../helpers/index.js";

export const buyNow = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      customerId,
      shippingAddressId,
      billingAddressId,
      lineItems,
      email,
      note,
      tags = [],
      discountCodes = [],
      acceptAutomaticDiscounts = false,
      paymentMethod,     
      currency = "INR",
    } = req.body as any;

    if (!customerId) {
      return res.status(400).json({ success: false, error: "Missing customerId" });
    }
    if (!shippingAddressId || !billingAddressId) {
      return res
        .status(400)
        .json({ success: false, error: "Provide shippingAddressId and billingAddressId" });
    }
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ success: false, error: "Missing lineItems" });
    }
    if (!["COD","ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, error: "Invalid paymentMethod" });
    }

    const { addresses } = await getCustomerAddress(customerId);
    const shippingAddress = addresses.addresses.find((a:any) => a.id === shippingAddressId);
    const billingAddress  = addresses.addresses.find((a:any) => a.id === billingAddressId);
    if (!shippingAddress || !billingAddress) {
      return res.status(404).json({ success: false, error: "Address not found" });
    }
      let shippingCharge = { title: "Prepaid", price: 150 };


    const draftInput = {
      customerId,
      lineItems,
      shippingAddress,
      billingAddress,
      email,
      note,
      tags: [
        ...tags,
        paymentMethod === "COD" ? "COD" : "PREPAID"
      ],
      discountCodes,
      acceptAutomaticDiscounts,
      shippingCharge,
    };

    if (paymentMethod === "COD") {
    const { draftOrderId } = await createDraftOrder(draftInput);
      const result = await completeDraftOrder(draftOrderId, true);

      return res.json({
        success: true,
        shopifyOrderId: result.shopifyOrderId,
        message: "COD order created; payment pending on delivery",
      });
    }
    //   razorpayOrderID: razorpayOrderId,
    //   customerId,
    //   shippingAddress,
    //   billingAddress,
    //   lineItems:lineItems,
    //   amount: paise,
    //   currency,
    //   flowType:"Buy_Now",
    //   status: "LINK_CREATED",
    //   discountCodes,
    //   acceptAutomaticDiscounts,
    //   tags: draftInput.tags,
    // });

    return res.json({
      success:        true,
      message:        "Choose payment method as COD",
    });
  } catch (err:any) {
    console.error("buyNow error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
