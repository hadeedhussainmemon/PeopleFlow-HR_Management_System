import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '../config/api';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password, rememberMe });
      login(data);
    } catch (error) {
      console.error('Login failed', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen animated-gradient-login">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-72 h-72 login-orb rounded-full blur-3xl opacity-60 translate-x-[-20%] translate-y-[-10%] animate-[gradient-move_10s_linear_infinite]" />
      </div>
      <Card className="w-[380px] max-w-[92%] glass-card login-card border-slate-700/50 transform transition-transform hover:scale-[1.01]">
        <CardHeader>
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-inner mb-2" style={{ backgroundColor: 'hsl(var(--primary) / 0.12)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zM2 16a8 8 0 0116 0H2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to continue to PeopleFlow.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            {error && (
              <div role="alert" aria-live="polite" className="mb-4 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded">
                {error}
              </div>
            )}
            <div className="grid w-full items-center gap-4">
              <div className="relative flex flex-col space-y-1.5 floating-label">
                <div className="absolute left-3 top-2.5 pointer-events-none"><User className="h-4 w-4 text-muted-foreground" /></div>
                <Input id="email" type="email" placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} className="bg-transparent login-input pl-10" aria-label="Email" />
                <Label htmlFor="email" className="login-label">Email</Label>
              </div>
              <div className="relative flex flex-col space-y-1.5 floating-label">
                <div className="absolute left-3 top-2.5 pointer-events-none"><Lock className="h-4 w-4 text-muted-foreground" /></div>
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder=" " value={password} onChange={(e) => setPassword(e.target.value)} className="bg-transparent login-input pl-10" aria-label="Password" aria-describedby="passwordHelp" />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-2.5" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
                <Label htmlFor="password" className="login-label">Password</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  id="rememberMe" 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <Label htmlFor="rememberMe" className="cursor-pointer font-normal">
                  Remember me for 30 days (otherwise 1 hour)
                </Label>
              </div>
            </div>
          </CardContent>
            <CardFooter className="flex flex-col gap-4">
            <div className="flex items-center justify-between w-full text-sm">
              <div className="text-sm">{/* placeholder for forgot password link */}</div>
              <div>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot Password?</Link>
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-md hover:scale-105 transition-transform" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;

