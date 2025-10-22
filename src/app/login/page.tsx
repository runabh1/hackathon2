'use client';

import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
  const auth = useAuth();

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  return (
    <AuthFormWrapper
      title="Welcome to MentorAI"
      description="Sign in to access your personalized student dashboard."
    >
      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full font-semibold"
          onClick={handleGoogleSignIn}
        >
          <FcGoogle className="mr-2 h-5 w-5" />
          Sign In with Google
        </Button>
        <p className="px-8 text-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </AuthFormWrapper>
  );
}
