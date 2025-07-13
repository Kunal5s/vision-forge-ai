// src/app/admin/actions.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret-for-local-dev-32-chars');
const alg = 'HS256';

interface UserPayload {
  email: string;
  expires: Date;
}

export async function encrypt(payload: UserPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('2h') // 2 hours from now
    .sign(secret);
}

export async function decrypt(input: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(input, secret, {
      algorithms: [alg],
    });
    return payload as UserPayload;
  } catch (error) {
    console.error('Failed to decrypt session cookie:', error);
    return null;
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Securely compare credentials on the server
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      // Create the session
      const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      const session = await encrypt({ email, expires });

      // Save the session in a cookie
      cookies().set('session', session, { expires, httpOnly: true });
      
    } else {
      return 'Invalid email or password.';
    }
  } catch (error) {
    console.error(error);
    return 'An unexpected error occurred.';
  }
  
  redirect('/admin/dashboard');
}

export async function logout() {
  // Destroy the session
  cookies().set('session', '', { expires: new Date(0) });
  redirect('/admin');
}

export async function getUser() {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return null;
    const userPayload = await decrypt(sessionCookie);
    if (!userPayload) return null;
    return { email: userPayload.email };
}
