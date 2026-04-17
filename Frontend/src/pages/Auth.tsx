import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { authAPI } from '@/lib/api';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const { user, isAdmin, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect once auth has finished loading
    if (!loading && user) {
      // Check if there's a redirect path
      const from = (location.state as any)?.from?.pathname || '/';
      
      if (isAdmin && from === '/') {
        navigate('/admin');
      } else if (from === '/checkout' || sessionStorage.getItem('quickCheckout')) {
        navigate('/checkout');
      } else {
        navigate(from);
      }
    }
  }, [user, isAdmin, loading, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          console.error('Login error:', error);
          toast.error('Login failed. Please check your credentials.');
        } else {
          toast.success('Welcome back!');
        }
      } else {
        const { error } = await signUp(email, password, name);
        if (error) {
          console.error('Registration error:', error);
          toast.error('Registration failed. Please try again.');
        } else {
          toast.success('Account created! You can now sign in.');
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    try {
      await authAPI.requestPasswordReset(resetEmail);
      toast.success('Reset code sent! Check your email.');
      setResetStep('verify');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast.error('Unable to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      if (!resetToken) {
        toast.error('Reset session expired. Please request a new code.');
        setResetStep('request');
        return;
      }
      await authAPI.resetPassword(resetToken, newPassword);
      toast.success('Password reset successfully. Please sign in.');
      setIsForgotMode(false);
      setIsLogin(true);
      setResetStep('request');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error('Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetCode) {
      toast.error('Please enter your email and code.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await authAPI.verifyResetCode(resetEmail, resetCode);
      toast.success('Code verified. Set your new password.');
      setResetToken(data.resetToken || '');
      setResetStep('reset');
    } catch (error: any) {
      console.error('Verify code error:', error);
      toast.error('Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartDrawer />

      <main className="pt-20 min-h-screen flex items-center justify-center py-16">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-12">
            <Link to="/" className="font-display text-2xl tracking-[0.3em]">
              SENSUS <span className="text-primary">PERFUME</span>
            </Link>
          </div>

          <div className="bg-secondary p-8 md:p-12 border border-border">
            {!isForgotMode && (
              <>
                <div className="flex mb-8">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 pb-4 text-sm tracking-[0.15em] uppercase border-b-2 transition-colors ${
                      isLogin ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 pb-4 text-sm tracking-[0.15em] uppercase border-b-2 transition-colors ${
                      !isLogin ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                    }`}
                  >
                    Register
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {!isLogin && (
                    <div>
                      <label className="block text-xs tracking-[0.1em] uppercase text-muted-foreground mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={!isLogin}
                        className="w-full bg-background border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs tracking-[0.1em] uppercase text-muted-foreground mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-background border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs tracking-[0.1em] uppercase text-muted-foreground mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-background border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  {isLogin && (
                    <div className="text-right">
                      <button 
                        type="button"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => {
                          setIsForgotMode(true);
                          setResetStep('request');
                          setResetEmail(email);
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <Button variant="hero" size="lg" className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                  </Button>
                </form>
              </>
            )}

            {isForgotMode && (
              <>
                <div className="flex items-center justify-between mb-8">
                  <p className="text-sm tracking-[0.15em] uppercase text-muted-foreground">
                    Reset Password
                  </p>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => {
                      setIsForgotMode(false);
                      setResetStep('request');
                    }}
                  >
                    Back to Sign In
                  </button>
                </div>

                {resetStep === 'request' ? (
                  <form onSubmit={handleForgotRequest} className="space-y-6">
                    <div>
                      <label className="block text-xs tracking-[0.1em] uppercase text-muted-foreground mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        className="w-full bg-background border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <Button variant="hero" size="lg" className="w-full" type="submit" disabled={isLoading}>
                      {isLoading ? 'Sending...' : 'Send Reset Code'}
                    </Button>
                  </form>
                ) : resetStep === 'verify' ? (
                  <form onSubmit={handleVerifyCode} className="space-y-6">
                    <div>
                      <label className="block text-xs tracking-[0.1em] uppercase text-muted-foreground mb-2">
                        Reset Code
                      </label>
                      <input
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        required
                        className="w-full bg-background border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                      <p className="text-xs text-muted-foreground mt-2">Code expires in 2 minutes.</p>
                    </div>

                    <Button variant="hero" size="lg" className="w-full" type="submit" disabled={isLoading}>
                      {isLoading ? 'Verifying...' : 'Verify Code'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div>
                      <label className="block text-xs tracking-[0.1em] uppercase text-muted-foreground mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full bg-background border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs tracking-[0.1em] uppercase text-muted-foreground mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full bg-background border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <Button variant="hero" size="lg" className="w-full" type="submit" disabled={isLoading}>
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </form>
                )}
              </>
            )}

            <p className="text-center text-xs text-muted-foreground mt-8">
              By continuing, you agree to our{' '}
              <Link to="/" className="text-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/" className="text-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
