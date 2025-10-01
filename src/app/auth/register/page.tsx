/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/auth/register/page.tsx
"use client"; // This component runs on the client side

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react'; // For automatic login after registration
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ActivityIndicator } from '@/components/ui/activity-indicator'; // Custom loading indicator

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [firmName,setFirmName] = useState('')
  const [phone,setPhone] = useState<any>("")
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // State for loading indicator
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages
    setLoading(true); // Start loading

    try {
      // Send registration data to the /api/register endpoint
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password,firmName,phone }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Registration successful! Redirecting to dashboard...');
        // Attempt to sign in the user immediately after successful registration
        const signInResult = await signIn('credentials', {
          redirect: false, // Prevent NextAuth from redirecting automatically
          email,
          password,
        });

        if (signInResult?.ok) {
          router.push('/dashboard'); // Redirect to dashboard on successful auto-login
        } else {
          // Fallback if auto-login fails
          setMessage('Registration successful, but automatic login failed. Please log in manually.');
          router.push('/auth/login');
        }
      } else {
        setMessage(data.message || 'Registration failed.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('An unexpected error occurred during registration.');
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Register</CardTitle>
          <CardDescription className="text-center">Create your lawyer account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
              <Label htmlFor="email">firmName</Label>
              <Input
                id="firmName"
                type="text"
                placeholder="مكتب الخطيب للمحاماه"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>
          {message && (
            <p className={`text-center mt-4 text-sm ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </p>
          )}
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <a href="/auth/login" className="underline text-primary">
              Login here
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
