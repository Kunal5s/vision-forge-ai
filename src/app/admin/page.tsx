// src/app/admin/page.tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { authenticate } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, LogIn, AlertTriangle } from 'lucide-react';

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90" aria-disabled={pending}>
      <LogIn className="mr-2 h-4 w-4" /> {pending ? "Signing In..." : "Sign In"}
    </Button>
  );
}

export default function AdminLoginPage() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
           <div className="flex justify-center items-center gap-2 mb-2">
            <BrainCircuit className="h-8 w-8 text-foreground" />
            <span className="text-2xl font-bold text-foreground">
                Imagen BrainAi
              </span>
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="admin@example.com"
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                required
                 className="bg-background"
              />
            </div>
            {errorMessage && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <p>{errorMessage}</p>
              </div>
            )}
            <div>
              <LoginButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}