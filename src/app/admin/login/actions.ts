
'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

type LoginInput = z.infer<typeof loginSchema>;

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET_KEY || 'default-secret-key-for-dev');
const SESSION_COOKIE = 'session';

export async function loginAction(data: LoginInput): Promise<{ success: boolean; error?: string }> {
  const validatedFields = loginSchema.safeParse(data);

  if (!validatedFields.success) {
    return { success: false, error: 'Invalid data provided.' };
  }

  const { email, password } = validatedFields.data;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('Admin credentials are not set in environment variables.');
    return { success: false, error: 'Server configuration error.' };
  }

  if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
    // Create session token
    const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = await new SignJWT({ email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(expirationTime)
      .sign(secretKey);

    cookies().set(SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expirationTime,
      sameSite: 'lax',
      path: '/',
    });

    return { success: true };
  }

  return { success: false, error: 'Invalid email or password.' };
}

export async function verifySession() {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie, secretKey, { algorithms: ['HS256'] });
    return payload;
  } catch (e) {
    console.error('Session verification failed:', e);
    return null;
  }
}

export async function logoutAction() {
    cookies().delete(SESSION_COOKIE);
}
