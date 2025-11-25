import { z } from 'zod';

// --- Zod Schemas ---
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});
export type LoginDto = z.infer<typeof loginSchema>;

const registerSchemaBase = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  username: z
    .string()
    .min(3, 'O nome de utilizador deve ter pelo menos 3 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'O nome de utilizador só pode conter letras, números e _',
    }),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
});

type RegisterSchemaData = z.infer<typeof registerSchemaBase>;

export const registerSchema = registerSchemaBase.refine(
  (data: RegisterSchemaData) => data.password === data.confirmPassword,
  {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  },
);

export type RegisterDto = RegisterSchemaData;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordDtoSchema = z.object({
  newPassword: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  token: z.string(),
});
export type ResetPasswordDto = z.infer<typeof resetPasswordDtoSchema>;

const resetPasswordFormBaseSchema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  token: z.string(),
});
type ResetPasswordFormData = z.infer<typeof resetPasswordFormBaseSchema>;
export const resetPasswordFormSchema = resetPasswordFormBaseSchema.refine(
  (data: ResetPasswordFormData) => data.password === data.confirmPassword,
  {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  },
);
export type ResetPasswordFormDto = z.infer<typeof resetPasswordFormSchema>;

// --- Interfaces ---

export interface Subscription {
  id: string;
  status: 'FREE' | 'PREMIUM' | 'LIFETIME';
  freeContactsUsed: number;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'USER' | 'ADMIN';
  subscription: Subscription | null;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio: string | null;
  birthDate: string | null;
  birthTime: string | null;
  birthCity: string | null;
  currentCity: string | null;
  gender: string | null;
  imageUrl: string | null;
  searchRadius: number | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface UpdateUnverifiedEmailDto {
  newEmail: string;
  password: string;
}