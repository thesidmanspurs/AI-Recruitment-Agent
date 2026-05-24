import { useState, type FormEvent } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { ApiError } from '../api/client';
import { AuthShell, Field } from './LoginPage';

interface RegisterPageProps {
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onRegister, onSwitchToLogin }: RegisterPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onRegister(name, email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      heading={
        <>
          Start hiring smarter
          <br />
          from day one.
        </>
      }
      tagline="Set up your account and launch your first AI-powered sourcing campaign in minutes."
    >
      <div className="w-full max-w-sm">
        <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <span className="text-base font-extrabold text-white">A</span>
          </div>
          <span className="text-gray-900 font-bold text-lg">ARIES</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
        <p className="text-sm text-gray-500 mb-8">Get started with AI-powered recruiting</p>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            label="Full name"
            icon={<User className="w-4 h-4 text-gray-400" />}
            type="text"
            value={name}
            onChange={setName}
            placeholder="Jane Smith"
            required
          />
          <Field
            label="Email address"
            icon={<Mail className="w-4 h-4 text-gray-400" />}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            required
          />
          <Field
            label="Password"
            icon={<Lock className="w-4 h-4 text-gray-400" />}
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Min. 8 characters"
            required
            hint="At least 8 characters. Mix letters and numbers for a stronger password."
          />
          <Field
            label="Confirm password"
            icon={<Lock className="w-4 h-4 text-gray-400" />}
            type="password"
            value={confirm}
            onChange={setConfirm}
            placeholder="••••••••"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm shadow-sm shadow-indigo-600/20 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Create account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </AuthShell>
  );
}
