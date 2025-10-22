'use client';

import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
      toast({
        title: 'Check Your Email',
        description: 'A password reset link has been sent to your email address.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormWrapper
      title="Forgot Your Password?"
      description="No problem. Enter your email below to receive a reset link."
    >
      {submitted ? (
        <div className="text-center">
          <p className="text-muted-foreground">
            If an account with that email exists, a password reset link has been sent. Please check your inbox (and spam folder).
          </p>
          <Button asChild className="mt-4 w-full font-semibold">
            <Link href="/login">Return to Sign In</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="space-y-2">
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
          <Button type="submit" className="w-full font-semibold" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
          <Button variant="link" asChild className="w-full">
            <Link href="/login">Cancel</Link>
          </Button>
        </form>
      )}
    </AuthFormWrapper>
  );
}
