import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  price: z.number().positive(),
  cat: z.enum(['phone', 'notebook', 'monitor']),
  desc: z.string(),
  img: z.string(),
});

export const ProductListSchema = z.object({
  Items: z.array(ProductSchema),
});

export const CartItemSchema = z.object({
  id: z.string().min(1),
  cookie: z.string().min(1),
  prod_id: z.number().int(),
});

export const CartSchema = z.object({
  Items: z.array(CartItemSchema),
});

export const SessionSchema = z.object({
  Item: z.object({
    username: z.string(),
    token: z.string(),
    expiration: z.number(),
  }),
});

export const ErrorSchema = z.object({
  errorMessage: z.string(),
});

export const TokenSchema = z.string().startsWith('Auth_token: ');

export type Product = z.infer<typeof ProductSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type Session = z.infer<typeof SessionSchema>;
