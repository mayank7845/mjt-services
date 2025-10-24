import axios from "axios";
import dotenv from 'dotenv';
dotenv.config();
const ADMIN_TOKEN = process.env.SHOPIFY_API_TOKEN;
const SHOP_URL = process.env.SHOP_URL;
async function shopifyRequest(query, variables = {}) {
    try {
        const response = await axios.post(`https://${SHOP_URL}/admin/api/2025-04/graphql.json`, { query, variables }, {
            headers: {
                "X-Shopify-Access-Token": ADMIN_TOKEN,
                "Content-Type": "application/json",
            },
        });
        if (response.data.errors) {
            throw new Error(JSON.stringify(response.data.errors));
        }
        return response.data.data;
    }
    catch (err) {
        if (axios.isAxiosError(err) && err.response?.data) {
            console.error("Shopify GraphQL Error:", JSON.stringify(err.response.data, null, 2));
            throw new Error(JSON.stringify(err.response.data));
        }
        throw err;
    }
}
;
export async function getCustomerAddress(customerId) {
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
;
export async function createDraftOrder(input) {
    const mutation = `
    mutation draftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder { id }
        userErrors { field message }
      }
    }
  `;
    const payload = {
        lineItems: input.lineItems.map(li => ({
            variantId: li.variantId,
            quantity: li.quantity
        })),
        ...(input.shippingCharge && {
            shippingLine: {
                title: input.shippingCharge.title,
                price: input.shippingCharge.price.toFixed(2),
            }
        }),
        ...(input.discountCodes?.length && { discountCodes: input.discountCodes }),
        acceptAutomaticDiscounts: input.acceptAutomaticDiscounts,
        customerId: input.customerId,
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress,
        email: input.email,
        note: input.note,
        tags: input.tags,
    };
    const resp = await shopifyRequest(mutation, { input: payload });
    if (resp.draftOrderCreate.userErrors.length) {
        throw new Error(resp.draftOrderCreate.userErrors.map((e) => e.message).join("; "));
    }
    return { draftOrderId: resp.draftOrderCreate.draftOrder.id };
}
;
export async function completeDraftOrder(draftOrderId, paymentPending) {
    const mutation = `
    mutation draftOrderComplete($id: ID!, $paymentPending: Boolean!) {
      draftOrderComplete(id: $id, paymentPending: $paymentPending) {
        userErrors { field message }
        draftOrder {
          order {
            id
            displayFinancialStatus
            totalPriceSet { shopMoney { amount currencyCode } }
            lineItems(first: 50) {
              nodes {
                id
                title
                quantity
                variant { id }
              }
            }
          }
        }
      }
    }
  `;
    const variables = { id: draftOrderId, paymentPending };
    const data = await shopifyRequest(mutation, variables);
    const payload = data.draftOrderComplete;
    if (payload.userErrors?.length) {
        const msg = payload.userErrors
            .map((e) => {
            if (e.field && Array.isArray(e.field)) {
                return `${e.field.join(",")}: ${e.message}`;
            }
            return e.message;
        })
            .join("; ");
        throw new Error("draftOrderComplete errors: " + msg);
    }
    const order = payload.draftOrder?.order;
    if (!order?.id) {
        throw new Error("No order returned from draftOrderComplete");
    }
    return {
        shopifyOrderId: order.id,
        displayFinancialStatus: order.displayFinancialStatus,
        totalPriceSet: order.totalPriceSet,
        lineItems: order.lineItems.nodes,
    };
}
;
//  export async function calculateBuyNowTotal(
//   lineItems: any[],
//   shippingCharge: { title: string; price: number }
// ): Promise<any> {
//   const query = `
//     query variantPrices($ids: [ID!]!) {
//       nodes(ids: $ids) {
//         ... on ProductVariant {
//           id
//           presentmentPrices(first:1) {
//             edges {
//               node {
//                 price {
//                   amount
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   `;
//   const ids = lineItems.map(li => li.variantId);
//   const resp: any = await shopifyRequest(query, { ids });
//   const subtotal = (resp.nodes as any[]).reduce((sum, node, idx) => {
//     const variant = lineItems.find(li => li.variantId === node.id)!;
//     const price = parseFloat(
//       node.presentmentPrices.edges[0].node.price.amount
//     );
//     return sum + price * variant.quantity;
//   }, 0);
//   const shipping = shippingCharge.price;
//   return { subtotal, shipping, total: subtotal + shipping };
// };
// const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
// const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
// const razorpayInstance = new Razorpay({
//   key_id: RAZORPAY_KEY_ID,
//   key_secret: RAZORPAY_KEY_SECRET,
// });
// export async function createOrderAndLink(
//   amountPaise: number,
//   currency: string,
//   referenceId: string,
//   customer: { email?: string; contact?: string },
//   callbackUrl?: string
// ) {
//   const order: any = await razorpayInstance.orders.create({
//     amount: amountPaise,
//     currency,
//     receipt: referenceId,
//   });
//   const razorpayOrderId: string = order.order_id || order.order?.id || order.id;
//   const payload: any = {
//     amount: amountPaise,
//     currency,
//     reference_id: referenceId,
//     customer: {
//       ...(customer.email && { email: customer.email }),
//       ...(customer.contact && { contact: customer.contact }),
//     },
//   };
//   if (callbackUrl) {
//     payload.callback_url = callbackUrl;
//     payload.callback_method = "get";
//   }
//   return { razorpayOrderId };
// };
