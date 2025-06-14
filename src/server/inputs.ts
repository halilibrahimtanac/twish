import { z } from 'zod';

export const addUserInput = z.object({
  name: z.string().min(1),
  email: z.string().email().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  confirmPassword: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'], // Hata bu alana bağlı gösterilir
  message: "Passwords don't match",
});

export const loginInput = z.object({
  email: z.string().min(1),
  password: z.string().min(1)
});