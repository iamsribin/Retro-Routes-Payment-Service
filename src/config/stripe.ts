import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

console.log("lkjl",process.env.STRIPE_SECRET_KEY);

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

// "2025-06-30.basil"