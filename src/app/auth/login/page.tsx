/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/auth/login/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ActivityIndicator } from '@/components/ui/activity-indicator';
import Link from 'next/link';

// Login Form Component that handles the actual login logic
function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('/dashboard');
  
  const router = useRouter();

  // Get callback URL from URL parameters on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const callback = urlParams.get('callbackUrl') || '/dashboard';
      const error = urlParams.get('error');
      
      setCallbackUrl(callback);
      
      if (error === 'account_disabled') {
        setMessage('تم تعطيل حسابك. يرجى الاتصال بالإدارة.');
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Login Page - Callback URL:', callback);
        console.log('🔍 Error param:', error);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      console.log('🚀 Starting sign in process...');
      console.log('📍 Callback URL:', callbackUrl);

      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      console.log('📝 Sign in result:', result);

      if (result?.error) {
        console.log('❌ Sign in error:', result.error);
        setMessage(result.error);
        setLoading(false);
        return;
      }

      if (result?.ok) {
        console.log('✅ Sign in successful!');
        
        const session = await getSession();
        console.log('📊 Session data:', session);
        
        if (session?.user?.isActive === false) {
          setMessage('تم تعطيل حسابك. يرجى الاتصال بالإدارة.');
          setLoading(false);
          return;
        }
        
        console.log('🔄 Redirecting to:', callbackUrl);
        window.location.replace(callbackUrl);
        return;
      }

      setMessage('حدث خطأ في تسجيل الدخول');
      
    } catch (error) {
      console.error('❌ Login error:', error);
      setMessage('حدث خطأ في تسجيل الدخول');
    }

    setLoading(false);
  };

  return (
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
      </CardContent>
    </Card>
  );
}

// Loading component
function LoginLoading() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Login</CardTitle>
        <CardDescription className="text-center">Loading...</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center py-8">
        <ActivityIndicator />
      </CardContent>
    </Card>
  );
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Suspense fallback={<LoginLoading />}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}