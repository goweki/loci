// lib/payments.ts

import Paystack from "paystack-sdk";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET_KEY) {
  throw new Error("Missing process.env.PAYSTACK_SECRET_KEY");
}

const paystack = new Paystack(PAYSTACK_SECRET_KEY);

export default paystack;
