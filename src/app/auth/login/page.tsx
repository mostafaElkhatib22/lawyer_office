// src/app/auth/login/page.tsx
"use client"; // This component runs on the client side

import { useState } from 'react';
import { signIn } from 'next-auth/react'; // For handling login via NextAuth.js
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ActivityIndicator } from '@/components/ui/activity-indicator'; // Custom loading indicator

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // State for loading indicator
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages
    setLoading(true); // Start loading

    // Use NextAuth's signIn function with the 'credentials' provider
    const result = await signIn('credentials', {
      redirect: false, // Prevent NextAuth from redirecting automatically
      email,
      password,
    });

    if (result?.error) {
      // Display error message from NextAuth (e.g., 'Invalid credentials.')
      setMessage(result.error);
    } else {
      // If login is successful, redirect to the dashboard
      router.push('/dashboard');
    }
    setLoading(false); // End loading
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">Login to your lawyer account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <ActivityIndicator className="mr-2" /> : null}
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          {message && <p className="text-center mt-4 text-red-500 text-sm">{message}</p>}
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <a href="/auth/register" className="underline text-primary">
              Register here
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
