import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { AuthBackground } from '@/components/AuthBackground';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type AuthView = 'login' | 'signup' | 'forgot-password' | 'reset-password';

const Auth = () => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && view !== 'reset-password') {
      navigate('/');
    }
  }, [user, navigate, view]);

  // Check for password recovery event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('reset-password');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result?.error) {
        setError(result.error.message || 'Google sign-in failed');
      }
    } catch (err) {
      setError('Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (view === 'login' || view === 'signup') {
      const validation = authSchema.safeParse({ email, password });
      if (!validation.success) {
        setError(validation.error.errors[0].message);
        setLoading(false);
        return;
      }
    }

    try {
      if (view === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password');
          } else {
            setError(error.message);
          }
        }
      } else if (view === 'signup') {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('User already registered')) {
            setError('An account with this email already exists');
          } else {
            setError(error.message);
          }
        }
      } else if (view === 'forgot-password') {
        if (!email) {
          setError('Please enter your email');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`
        });
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Password reset link sent! Check your inbox.');
        }
      } else if (view === 'reset-password') {
        if (newPassword.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Password updated successfully! Redirecting...');
          setTimeout(() => navigate('/'), 2000);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Reset password view
  if (view === 'reset-password') {
    return (
      <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center px-6 overflow-hidden">
        <AuthBackground />
        <div className="relative w-full max-w-sm z-10">
          <div className="border border-foreground p-8 bg-background/80 backdrop-blur-sm">

            <h1 className="font-mono text-lg font-bold uppercase tracking-widest mb-6 text-center">
              Set New Password
            </h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider block mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-background border border-foreground px-3 py-2 font-mono text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <p className="font-mono text-xs text-destructive">{error}</p>}
              {success && <p className="font-mono text-xs text-primary">{success}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full border border-foreground bg-foreground text-background px-4 py-3 font-mono text-sm uppercase tracking-wider hover:bg-background hover:text-foreground disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password view
  if (view === 'forgot-password') {
    return (
      <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center px-6 overflow-hidden">
        <AuthBackground />
        <div className="relative w-full max-w-sm z-10 border border-foreground p-8 bg-background/80 backdrop-blur-sm">
            <img src="/logo.png" alt="Zystem" className="w-16 h-16 mb-4" />
            <h1 className="font-mono text-lg font-bold uppercase tracking-widest text-center">
              Zystem
            </h1>
          </div>
          <h2 className="font-mono text-sm font-semibold uppercase tracking-widest mb-8">
            Reset Password
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="font-mono text-xs uppercase tracking-wider block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-foreground px-3 py-2 font-mono text-sm"
                placeholder="you@example.com"
                required
              />
            </div>
            {error && <p className="font-mono text-xs text-destructive">{error}</p>}
            {success && <p className="font-mono text-xs text-primary">{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full border border-foreground bg-foreground text-background px-4 py-3 font-mono text-sm uppercase tracking-wider hover:bg-background hover:text-foreground disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          <div className="mt-8 text-center">
            <button
              onClick={() => { setView('login'); setError(''); setSuccess(''); }}
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login / Signup view
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-12">
          <img src="/logo.png" alt="Zystem" className="w-16 h-16 mb-4" />
          <h1 className="font-mono text-lg font-bold uppercase tracking-widest text-center">
            Zystem
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
            Your Level Up Partner
          </p>
        </div>

        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest mb-8">
          {view === 'login' ? 'Sign In' : 'Create Account'}
        </h2>

        {/* Google Sign In - hidden on mobile/Capacitor */}
        <div className="hidden md:block">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full border border-foreground px-4 py-3 font-mono text-sm uppercase tracking-wider hover:bg-foreground hover:text-background disabled:opacity-50 flex items-center justify-center gap-3 mb-6"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9.003 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 border-t border-muted-foreground/30" />
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <div className="flex-1 border-t border-muted-foreground/30" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="font-mono text-xs uppercase tracking-wider block mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-foreground px-3 py-2 font-mono text-sm"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="font-mono text-xs uppercase tracking-wider block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-foreground px-3 py-2 font-mono text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="font-mono text-xs text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-foreground bg-foreground text-background px-4 py-3 font-mono text-sm uppercase tracking-wider hover:bg-background hover:text-foreground disabled:opacity-50"
          >
            {loading ? 'Loading...' : view === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        {view === 'login' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => { setView('forgot-password'); setError(''); }}
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setView(view === 'login' ? 'signup' : 'login');
              setError('');
            }}
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {view === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <p className="mt-8 text-center font-mono text-xs tracking-wider text-muted-foreground/60">
          A <span className="font-bold text-foreground">Zyphor</span> product
        </p>
      </div>
    </div>
  );
};

export default Auth;
