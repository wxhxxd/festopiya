'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VendorProfile() {
  const [stallName, setStallName] = useState('');
  const [foodCategory, setFoodCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  // 1. Fetch existing profile data when the page loads
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setStallName(profile.stall_name || '');
        setFoodCategory(profile.food_category || '');
      }
      setLoading(false);
    }
    
    loadProfile();
  }, [supabase, router]);

  // 2. Save or Update the profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // UPSERT: Updates the row if the ID exists, or creates a new one if it doesn't!
    const { error } = await supabase
      .from('vendor_profiles')
      .upsert({
        id: user.id, // This links the profile exactly to their login email
        stall_name: stallName,
        food_category: foodCategory,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      setMessage({ text: 'Failed to save profile: ' + error.message, type: 'error' });
    } else {
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center font-black text-gray-400">LOADING PROFILE...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Navigation & Header */}
        <div className="mb-10 border-b-4 border-black pb-6 flex justify-between items-end">
          <div>
            <Link href="/vendor/dashboard" className="text-blue-600 font-bold text-sm uppercase tracking-widest hover:underline mb-2 inline-block">
              ← BACK TO DASHBOARD
            </Link>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic mt-2">BUSINESS PROFILE</h1>
            <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest">Manage how organizers see your stall.</p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-200">
          
          {message && (
            <div className={`p-4 rounded-xl mb-8 font-bold text-sm uppercase tracking-widest ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-8">
            
            {/* Stall Name Field */}
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Stall / Business Name *
              </label>
              <input
                type="text"
                required
                value={stallName}
                onChange={(e) => setStallName(e.target.value)}
                placeholder="e.g., Biryani Bhai"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-300"
              />
              <p className="text-xs text-gray-400 font-medium mt-2 italic">This is the name organizers will see when you request a spot.</p>
            </div>

            {/* Food Category Field */}
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Food Category *
              </label>
              <select
                required
                value={foodCategory}
                onChange={(e) => setFoodCategory(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none"
              >
                <option value="" disabled>Select your primary category</option>
                <option value="Fast Food">Fast Food</option>
                <option value="Biryani / Indian">Biryani / Indian</option>
                <option value="Beverages / Shakes">Beverages / Shakes</option>
                <option value="Desserts / Bakery">Desserts / Bakery</option>
                <option value="Momos / Chinese">Momos / Chinese</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-black hover:bg-blue-600 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {saving ? 'SAVING PROFILE...' : 'SAVE BUSINESS DETAILS'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}