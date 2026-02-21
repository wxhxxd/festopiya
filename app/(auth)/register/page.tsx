'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'vendor' | 'organizer'>('vendor');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  // NEW: This hook checks the URL when the page loads
  // If the URL says ?role=organizer, it auto-selects Organizer!
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlRole = searchParams.get('role');
      if (urlRole === 'organizer') {
        setRole('organizer');
      } else if (urlRole === 'vendor') {
        setRole('vendor');
      }
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      if (role === 'organizer') {
        router.push('/organizer/dashboard');
      } else {
        router.push('/vendor/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 selection:bg-blue-200">
      
      <Link href="/" className="text-3xl font-black text-gray-900 tracking-tighter italic mb-8 hover:text-blue-600 transition-colors">
        FESTOPIYA
      </Link>

      <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 w-full max-w-md animate-in fade-in zoom-in duration-300">
        <h1 className="text-3xl font-black text-gray-900 uppercase italic mb-2">Create Account</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Join the marketplace.</p>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold text-[10px] uppercase tracking-widest border border-red-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole('vendor')}
              className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border-2 ${
                role === 'vendor' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
              }`}
            >
              I'm a Vendor
            </button>
            <button
              type="button"
              onClick={() => setRole('organizer')}
              className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border-2 ${
                role === 'organizer' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
              }`}
            >
              Organizer
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com"
              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl disabled:bg-blue-300"
          >
            {loading ? 'CREATING ACCOUNT...' : 'SIGN UP & ENTER APP'}
          </button>

        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Log In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}