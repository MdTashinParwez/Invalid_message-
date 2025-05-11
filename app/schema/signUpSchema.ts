import {z} from 'zod';

// This schema validates the username for a sign-up form
// It checks that the username is between 3 and 20 characters long
export const usernameValidation = z
    .string()
    .min(3, { message: 'Username must be at least 3 characters long' })
    .max(20, { message: 'Username must be at most 20 characters long' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' });

// This schema validates the sign-up form
// It checks that the username is valid, the email is a valid email address, and the password is a valid password
    export const signUpSchema = z.object({
    username: usernameValidation,
    email: z
        .string()
        .email({ message: 'Invalid email address' }),
        password: z.string().min(8, { message: 'Password must be at least 8 characters long' })
    })