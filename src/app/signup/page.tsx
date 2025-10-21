import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import { SignupForm } from '@/components/auth/signup-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | MentorAI',
  description: 'Create a new MentorAI account.',
};

export default function SignupPage() {
  return (
    <AuthFormWrapper
      title="Create an Account"
      description="Start your journey to academic success today."
    >
      <SignupForm />
    </AuthFormWrapper>
  );
}
