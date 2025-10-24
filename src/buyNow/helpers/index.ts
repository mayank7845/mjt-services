import axios from "axios";
import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

const ADMIN_TOKEN = process.env.SHOPIFY_API_TOKEN;
const SHOP_URL = process.env.SHOP_URL;

async function shopifyRequest(query: string, variables = {}) {
  try {
    const response = await axios.post(
      `https://${SHOP_URL}/admin/api/2025-04/graphql.json`,
      { query, variables },
      {
        headers: {
          "X-Shopify-Access-Token": ADMIN_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.errors) {
      throw new Error(JSON.stringify(response.data.errors));
    }
    return response.data.data;
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response?.data) {
      console.error(
        "Shopify GraphQL Error:",
        JSON.stringify(err.response.data, null, 2)
      );
      throw new Error(JSON.stringify(err.response.data));
    }
    throw err;
  }
}

async function getCustomerAddress(customerId: string): Promise<any> {
  const query = `
    query customer($id: ID!) {
      customer(id: $id) {
        addresses {
          id
          firstName
          lastName
          company
          address1
          address2
          city
          province
          country
          zip
          phone
        }
        defaultAddress:defaultAddress{
          id
          }
      }
    }
  `;

  const data = await shopifyRequest(query, { id: customerId });
  if (!data.customer) {
    throw new Error(`customer ${customerId} not found`);
  }

  return { customerId: data.customer.id, addresses: data.customer };
}

async function createOrder(input: {
  customerId?: string;
  email?: string;
  lineItems: { variantId?: string; quantity: number; price?: number }[];
  shippingAddress?: any;
  billingAddress?: any;
  note?: string | null;
  tags?: string[];
  discountCodes?: string[] | null;
  shippingCharge?: { title: string; price: number } | null;
  currency?: string;
  markAsPaid?: boolean;
}) {
  const mutation = `
    mutation orderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
      orderCreate(order: $order, options: $options) {
        userErrors { field message }
        order { id displayFinancialStatus lineItems(first:50){ nodes { id title quantity variant { id } } } }
      }
    }
  `;

  const lineItems = input.lineItems.map((li) => {
    const item: any = {
      quantity: li.quantity,
    };
    if (li.variantId) item.variantId = li.variantId;
    else if (li.price !== undefined) {
      item.title = "Custom item";
      item.priceSet = {
        shopMoney: { amount: li.price, currencyCode: input.currency || "USD" },
      };
    }
    return item;
  });

  const transactions: any[] = [];
  if (input.markAsPaid) {
    transactions.push({
      kind: "SALE",
      status: "SUCCESS",
      amountSet: {
        shopMoney: {
          amount: lineItems.reduce((sum, li) => {
            return (
              sum +
              (li.priceSet?.shopMoney?.amount
                ? Number(li.priceSet.shopMoney.shopMoney?.amount ?? 0)
                : 0)
            );
          }, 0),
          currencyCode: input.currency || "USD",
        },
      },
    });
  }

  const orderPayload: any = {
    currency: input.currency || "USD",
    lineItems,
    customerId: input.customerId,
    email: input.email,
    shippingAddress: input.shippingAddress,
    billingAddress: input.billingAddress,
    note: input.note,
    tags: input.tags ? input.tags.join(",") : undefined,
    // discountCodes: input.discountCodes,
    transactions: transactions.length ? transactions : undefined,
    ...(input.shippingCharge && {
      shippingLines: [
        {
          title: input.shippingCharge.title,
          priceSet: {
            shopMoney: {
              amount: input.shippingCharge.price,
              currencyCode: input.currency || "USD",
            },
          },
        },
      ],
    }),
  };

  const options = {
    sendReceipt: false,
    sendFulfillmentReceipt: false,
  };

  const data = await shopifyRequest(mutation, { order: orderPayload, options });
  const payload = data.orderCreate;
  if (payload.userErrors?.length) {
    throw new Error(payload.userErrors.map((e: any) => e.message).join("; "));
  }
  return payload.order;
}

export { getCustomerAddress, createOrder };
