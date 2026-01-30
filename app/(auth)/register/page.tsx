import { AuthForm } from '@/components/AuthForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <AuthForm mode="register" />
    </div>
  );
}
