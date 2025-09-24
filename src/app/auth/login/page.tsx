/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/auth/login/page.tsx
"use client"; // This component runs on the client side

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react'; // For handling login via NextAuth.js
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ActivityIndicator } from '@/components/ui/activity-indicator'; // Custom loading indicator
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // State for loading indicator
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get callback URL from search params or default to dashboard
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const error = searchParams?.get('error');

  // Handle error from URL params (e.g., account_disabled)
  useEffect(() => {
    if (error === 'account_disabled') {
      setMessage('تم تعطيل حسابك. يرجى الاتصال بالإدارة.');
    }
  }, [error]);

  // Debug info for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Login Page - Callback URL:', callbackUrl);
      console.log('🔍 Search Params:', Object.fromEntries(searchParams?.entries() || []));
    }
  }, [callbackUrl, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages
    setLoading(true); // Start loading

    try {
      console.log('🚀 Starting sign in process...');
      console.log('📍 Callback URL:', callbackUrl);

      // Use NextAuth's signIn function with the 'credentials' provider
      const result = await signIn('credentials', {
        redirect: false, // Prevent NextAuth from redirecting automatically
        email,
        password,
        callbackUrl, // Pass the callback URL
      });

      console.log('📝 Sign in result:', result);

      if (result?.error) {
        console.log('❌ Sign in error:', result.error);
        // Display error message from NextAuth (e.g., 'Invalid credentials.')
        setMessage(result.error);
        setLoading(false);
        return;
      }

      if (result?.ok) {
        console.log('✅ Sign in successful!');
        
        // Get session to verify user data
        const session = await getSession();
        console.log('📊 Session data:', session);
        
        // Check if account is active
        if (session?.user?.isActive === false) {
          setMessage('تم تعطيل حسابك. يرجى الاتصال بالإدارة.');
          setLoading(false);
          return;
        }
        
        // Successful login - redirect to callback URL
        console.log('🔄 Redirecting to:', callbackUrl);
        
        // Use window.location.replace for a clean redirect
        window.location.replace(callbackUrl);
        return;
      }

      // Fallback error
      setMessage('حدث خطأ في تسجيل الدخول');
      
    } catch (error) {
      console.error('❌ Login error:', error);
      setMessage('حدث خطأ في تسجيل الدخول');
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
            <div>
              <Link href="/auth/forgot-password" className="text-sm underline text-primary">
                Forgot Password?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <ActivityIndicator className="mr-2" /> : null}
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          
          {message && (
            <div className={`text-center mt-4 text-sm p-3 rounded-md ${
              message.includes('تعطيل') || message.includes('خطأ') || message.includes('غير صحيحة')
                ? 'text-red-500 bg-red-50 border border-red-200' 
                : 'text-blue-500 bg-blue-50 border border-blue-200'
            }`}>
              {message}
            </div>
          )}
          
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <a href="/auth/register" className="underline text-primary">
              Register here
            </a>
          </div>
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <strong>Debug Info:</strong><br />
              Callback URL: {callbackUrl}<br />
              Error: {error || 'None'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}