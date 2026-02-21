'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ChatModal from '@/app/(auth)/components/ChatModal';
import Link from 'next/link';

type TabType = 'events' | 'requests' | 'finances';

export default function OrganizerDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // 1. Fetch Events created by this Organizer
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id) // Fixed .eq typo
        .order('created_at', { ascending: false });
      
      if (eventsData) setMyEvents(eventsData);

      // 2. Fetch All Stall Requests for this Organizer's events
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          events!inner (event_name, organizer_id),
          vendor_profiles:vendor_id (stall_name, food_category, phone)
        `)
        .eq('events.organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsData) setRequests(bookingsData);
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const updateStatus = async (id: string, newStatus: 'approved' | 'declined') => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } else {
      alert("Status update failed: " + error.message);
    }
  };

  // --- CALCULATIONS ---
  const totalRevenue = requests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-gray-400 tracking-widest uppercase bg-gray-50">Loading Hub...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans selection:bg-purple-200">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 p-6 z-20 shadow-sm">
        <div className="mb-12 mt-4">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic">FESTOPIYA</h1>
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ml-1">Organizer Hub</span>
        </div>
        <nav className="flex-1 space-y-3">
          <button onClick={() => setActiveTab('requests')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'requests' ? 'bg-black text-white shadow-xl shadow-black/20' : 'text-gray-500 hover:bg-gray-50'}`}>
            <span className="text-xl">📥</span> Stall Requests
          </button>
          <button onClick={() => setActiveTab('events')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'events' ? 'bg-black text-white shadow-xl shadow-black/20' : 'text-gray-500 hover:bg-gray-50'}`}>
            <span className="text-xl">📅</span> My Events
          </button>
          <button onClick={() => setActiveTab('finances')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'finances' ? 'bg-black text-white shadow-xl shadow-black/20' : 'text-gray-500 hover:bg-gray-50'}`}>
            <span className="text-xl">💰</span> Revenue
          </button>
        </nav>
        <Link href="/organizer/create-event" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] text-center shadow-lg shadow-purple-200 transition-all">
          + Create New Fest
        </Link>
      </aside>

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 p-2 flex justify-around items-center">
        <button onClick={() => setActiveTab('requests')} className={`p-3 rounded-xl ${activeTab === 'requests' ? 'text-purple-600' : 'text-gray-400'}`}>📥</button>
        <button onClick={() => setActiveTab('events')} className={`p-3 rounded-xl ${activeTab === 'events' ? 'text-purple-600' : 'text-gray-400'}`}>📅</button>
        <button onClick={() => setActiveTab('finances')} className={`p-3 rounded-xl ${activeTab === 'finances' ? 'text-purple-600' : 'text-gray-400'}`}>💰</button>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 relative z-10 pb-24 md:pb-12">
        
        {/* REQUESTS SECTION */}
        {activeTab === 'requests' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-8">Pending Stalls</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map((req) => (
                <div key={req.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-black transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 uppercase italic leading-none">{req.vendor_profiles?.stall_name || 'New Vendor'}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-2 tracking-widest">Event: {req.events?.event_name}</p>
                    </div>
                    <p className="text-2xl font-black text-gray-900 tracking-tighter italic">₹{req.total_amount}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <button onClick={() => updateStatus(req.id, 'approved')} className="flex-1 bg-black text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-600 transition-colors">Approve</button>
                        <button onClick={() => updateStatus(req.id, 'declined')} className="flex-1 bg-gray-100 text-gray-400 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest">Decline</button>
                      </>
                    ) : (
                      <div className={`w-full text-center py-3 rounded-xl font-black uppercase text-[10px] tracking-widest ${req.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {req.status === 'approved' ? '✅ Approved' : '❌ Declined'}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setActiveChat({ id: req.vendor_id, name: req.vendor_profiles?.stall_name })} className="w-full mt-3 bg-gray-50 text-gray-900 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-sm">
                    💬 Chat with Vendor
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EVENTS SECTION */}
        {activeTab === 'events' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-8">My Live Fests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {myEvents.map(event => (
                <div key={event.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm group">
                  <h3 className="text-2xl font-black text-gray-900 uppercase italic mb-4 group-hover:text-purple-600 transition-colors">{event.event_name}</h3>
                  <div className="space-y-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <p>📅 {new Date(event.event_date).toLocaleDateString()}</p>
                    <p>🎟️ Base Fee: ₹{event.base_stall_fee}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FINANCES SECTION */}
        {activeTab === 'finances' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-8">Financial Overview</h2>
            <div className="bg-black text-white p-10 rounded-[40px] shadow-2xl bg-gradient-to-br from-black via-zinc-900 to-purple-900">
              <p className="text-xs font-black text-purple-400 uppercase tracking-[0.3em] mb-4">Net Stall Revenue</p>
              <h3 className="text-7xl font-black tracking-tighter italic mb-8">₹{totalRevenue.toLocaleString()}</h3>
              <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/10">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase">Approved Stalls</p>
                  <p className="text-2xl font-black italic">{requests.filter(r => r.status === 'approved').length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase">Pending Offers</p>
                  <p className="text-2xl font-black italic">{requests.filter(r => r.status === 'pending').length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* CHAT MODAL */}
      {activeChat && <ChatModal currentUserId={currentUserId} recipientId={activeChat.id} recipientName={activeChat.name} onClose={() => setActiveChat(null)} />}
    </div>
  );
}