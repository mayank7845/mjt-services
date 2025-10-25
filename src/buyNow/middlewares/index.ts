import * as yup from "yup";

const addressSchema = yup.object({
  firstName: yup.string().required("First name is required!!"),
  lastName: yup.string().required("Last name is required!!"),
  address1: yup.string().required("Address line 1 is required!!"),
  address2: yup.string().nullable(), // optional
  city: yup.string().required("City is required!!"),
  province: yup.string().required("Province/State is required!!"),
  zip: yup
    .string()
    .matches(/^[0-9]+$/, "Invalid ZIP/postal code!!")
    .required("ZIP code is required!!"),
  country: yup.string().required("Country is required!!"),
  phone: yup
    .string()
    .matches(
      /^(?:\+91)?[6789][0-9]{4}([ ]?)[0-9]{5}$/,
      "Invalid phone number!!"
    )
    .required("Phone number is required!!"),
});

const buyNowModel = yup
  .object()
  .shape({
    email: yup
      .string()
      .email("Invalid email address!!")
      .required("Email is required!!"),
    lineItems: yup
      .array()
      .of(
        yup.object({
          variantId: yup
            .string()
            .matches(
              /^gid:\/\/shopify\/ProductVariant\/[0-9]+$/,
              "Invalid variant ID format!!"
            )
            .required("Variant ID is required!!"),
          quantity: yup
            .number()
            .integer("Quantity must be an integer!!")
            .min(1, "Quantity must be at least 1!!")
            .required("Quantity is required!!"),
        })
      )
      .min(1, "At least one line item is required!!")
      .required("Line items are required!!"),
    shippingAddress: addressSchema.required("Shipping address is required!!"),
    billingAddress: addressSchema.required("Billing address is required!!"),
    note: yup.string().nullable(),
    tags: yup
      .array()
      .of(yup.string())
      .default([])
      .required("Tags must be an array"),
  })
  .noUnknown(true, "Extra fields are not allowed!!");

export default buyNowModel;
