import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | MentorAI',
  description: 'Reset your MentorAI password.',
};

export default function ForgotPasswordPage() {
  return (
    <AuthFormWrapper
      title="Forgot Your Password?"
      description="No problem. Enter your email and we'll guide you through the reset process."
    >
      <ForgotPasswordForm />
    </AuthFormWrapper>
  );
}
