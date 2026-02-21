'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function CreateEvent() {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [footfall, setFootfall] = useState('');
  const [stallFee, setStallFee] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const router = useRouter();
  const supabase = createClient();

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // 1. Get the currently logged-in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You must be logged in to create an event.");
      setLoading(false);
      return;
    }

    // 2. Insert the event into the database
    const { error } = await supabase
      .from('events')
      .insert([
        {
          organizer_id: user.id,
          event_name: eventName,
          event_date: eventDate,
          expected_footfall: parseInt(footfall),
          base_stall_fee: parseFloat(stallFee),
        }
      ]);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Event published successfully!");
      // Send them back to the dashboard after 1.5 seconds
      setTimeout(() => {
        router.push('/organizer/dashboard');
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">List a New Fest</h1>
        
        <form onSubmit={handleCreateEvent} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Name (e.g. Tech Fusion 2026)</label>
            <input
              type="text"
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
              onChange={(e) => setEventName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Event Date</label>
            <input
              type="date"
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Expected Footfall</label>
              <input
                type="number"
                required
                placeholder="e.g. 5000"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                onChange={(e) => setFootfall(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Base Stall Fee (₹)</label>
              <input
                type="number"
                required
                placeholder="e.g. 3000"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                onChange={(e) => setStallFee(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 mt-4"
          >
            {loading ? 'Publishing Event...' : 'Publish Event'}
          </button>

          {message && (
            <p className={`text-sm text-center font-medium mt-4 ${message.includes('successfully') ? 'text-green-600' : 'text-red-500'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
