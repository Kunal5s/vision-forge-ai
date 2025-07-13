
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authenticate, getUser, logout } from '@/app/admin/actions';
import { LogIn, UserCheck, UserX } from 'lucide-react';

export function SubscriptionManager() {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<Awaited<ReturnType<typeof getUser>> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    getUser().then(setUser);
  }, []);

  const handleLogin = async (formData: FormData) => {
    const error = await authenticate(undefined, formData);
    if (error) {
      setErrorMessage(error);
      toast({
        title: 'Login Failed',
        description: error,
        variant: 'destructive'
      });
    } else {
      setErrorMessage(undefined);
      setIsOpen(false);
      // No need to redirect here, the authenticate action handles it.
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setIsOpen(false);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    // Redirect is handled by the logout action
  };
  
  const isLoggedIn = !!user;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-xs h-8">
          {isLoggedIn ? (
            <>
              <UserCheck className="mr-2 h-4 w-4 text-green-500" />
              Admin
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Admin Login
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isLoggedIn ? 'Admin Controls' : 'Admin Panel Login'}</DialogTitle>
          <DialogDescription>
            {isLoggedIn ? 'You are currently logged in as admin.' : 'Enter your credentials to access the admin dashboard.'}
          </DialogDescription>
        </DialogHeader>

        {isLoggedIn ? (
          <div className="py-4">
             <p className="text-sm text-center text-muted-foreground">
                Welcome back, <span className="font-semibold text-foreground">{user.email}</span>
            </p>
          </div>
        ) : (
           <form action={handleLogin} className="space-y-4 py-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  required
                />
              </div>
               {errorMessage && (
                  <p className="text-sm text-destructive text-center">{errorMessage}</p>
                )}
              <DialogFooter>
                <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90">
                  <LogIn className="mr-2 h-4 w-4" /> Sign In
                </Button>
              </DialogFooter>
           </form>
        )}
        
        {isLoggedIn && (
           <DialogFooter className="!justify-between gap-2">
            <Button onClick={() => window.location.href='/admin/dashboard'} variant="secondary">Go to Dashboard</Button>
            <Button onClick={handleLogout} variant="destructive">
              <UserX className="mr-2 h-4 w-4" /> Logout
            </Button>
           </DialogFooter>
        )}

      </DialogContent>
    </Dialog>
  );
}
