import { z } from 'zod';

export const addUserInput = z.object({
  name: z.string().min(1),
  email: z.string().email().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  confirmPassword: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: "Passwords don't match",
});

export const loginInput = z.object({
  email: z.string().min(1),
  password: z.string().min(1)
});

export const getUserProfileInfosInput = z.object({
  id: z.string().min(1)
});

export const saveUserInfoInput = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  bio: z.string().optional(),
  profilePictureUrl: z.string().optional(),
  backgroundPictureUrl: z.string().optional(),
  location: z.string().optional()
});

export type SaveUserInputType = z.infer<typeof saveUserInfoInput>;
export type GetUserProfileInfosInput = z.infer<typeof getUserProfileInfosInput>;
export type AddUserInput = z.infer<typeof addUserInput>;
export type LoginInput = z.infer<typeof loginInput>;