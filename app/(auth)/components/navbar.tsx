'use client';

import { createClient } from '../../../utils/supabase/client'; 
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link'; // Added for fast routing

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
      } else {
        setUserEmail('');
      }
    }
    getUser();
  }, [pathname, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Hide the navbar on login/register screens
  if (pathname === '/login' || pathname === '/register') return null;

  // Determine the user's role based on the URL they are looking at
  const isVendor = pathname.startsWith('/vendor');
  const isOrganizer = pathname.startsWith('/organizer');
  
  // Make the logo act as a "Home" button
  const homeLink = isVendor ? '/vendor/dashboard' : isOrganizer ? '/organizer/dashboard' : '/';

  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
      
      {/* Clickable Logo */}
      <Link href={homeLink}>
        <div className="text-2xl font-black text-gray-900 tracking-tighter italic cursor-pointer hover:text-blue-600 transition-colors">
          FESTOPIYA
        </div>
      </Link>
      
      {userEmail && (
        <div className="flex items-center space-x-6">
          
          {/* VENDOR LINKS */}
          {isVendor && (
            <div className="flex space-x-6 mr-4 border-r border-gray-200 pr-8 hidden md:flex">
               <Link href="/vendor/dashboard" className="text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors">
                Marketplace
              </Link>
              <Link href="/vendor/profile" className="text-xs font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors">
                My Profile
              </Link>
            </div>
          )}

          {/* ORGANIZER LINKS */}
          {isOrganizer && (
            <div className="flex space-x-6 mr-4 border-r border-gray-200 pr-8 hidden md:flex">
               <Link href="/organizer/dashboard" className="text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors">
                Hub
              </Link>
              <Link href="/organizer/create-event" className="text-xs font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors">
                + New Fest
              </Link>
            </div>
          )}

          {/* User Info & Logout */}
          <span className="text-sm font-bold text-gray-400 hidden sm:block">{userEmail}</span>
          <button 
            onClick={handleLogout} 
            className="text-xs bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-5 py-2 rounded-xl font-black uppercase tracking-widest transition-all"
          >
            Log Out
          </button>
        </div>
      )}
    </nav>
  );
}