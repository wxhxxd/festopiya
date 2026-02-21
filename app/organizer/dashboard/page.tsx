'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ChatModal from '@/app/(auth)/components/ChatModal';
import Link from 'next/link';

type TabType = 'requests' | 'events' | 'finances';

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

      // 1. Fetch Events created by you
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (eventsData) setMyEvents(eventsData);

      // 2. Fetch All Stall Requests + Vendor Profiles (Link established)
      const { data: bookingsData } = await supabase
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
      alert("Failed to update: " + error.message);
    }
  };

  const totalRevenue = requests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="font-black text-gray-400 uppercase tracking-widest animate-pulse">Syncing Command Center...</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans selection:bg-purple-200">
      
      {/* FULL SIDEBAR - DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 p-8 z-20">
        <div className="mb-12">
          <h1 className="text-3xl font-black text-black italic tracking-tighter">FESTOPIYA</h1>
          <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] mt-1">Organizer Hub</p>
        </div>
        
        <nav className="flex-1 space-y-4">
          <button onClick={() => setActiveTab('requests')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-xs transition-all ${activeTab === 'requests' ? 'bg-black text-white shadow-2xl' : 'text-gray-400 hover:bg-gray-50 hover:text-black'}`}>
            📥 Requests
          </button>
          <button onClick={() => setActiveTab('events')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-xs transition-all ${activeTab === 'events' ? 'bg-black text-white shadow-2xl' : 'text-gray-400 hover:bg-gray-50 hover:text-black'}`}>
            📅 My Events
          </button>
          <button onClick={() => setActiveTab('finances')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-xs transition-all ${activeTab === 'finances' ? 'bg-black text-white shadow-2xl' : 'text-gray-400 hover:bg-gray-50 hover:text-black'}`}>
            💰 Revenue
          </button>
        </nav>

        <div className="pt-8 border-t border-gray-100">
          <Link href="/organizer/create-event" className="flex items-center justify-center w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-purple-100">
            + Add New Event
          </Link>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 p-4 flex justify-around items-center">
        <button onClick={() => setActiveTab('requests')} className={activeTab === 'requests' ? 'text-purple-600' : 'text-gray-300'}>📥</button>
        <button onClick={() => setActiveTab('events')} className={activeTab === 'events' ? 'text-purple-600' : 'text-gray-300'}>📅</button>
        <button onClick={() => setActiveTab('finances')} className={activeTab === 'finances' ? 'text-purple-600' : 'text-gray-300'}>💰</button>
        <Link href="/organizer/create-event" className="text-black">➕</Link>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 pb-32">
        
        {activeTab === 'requests' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-black text-black uppercase italic tracking-tighter mb-10">Stall Requests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed rounded-[40px] border-gray-200">
                  <p className="text-gray-300 font-black uppercase text-[10px] tracking-widest">No pending stall offers yet.</p>
                </div>
              )}
              {requests.map((req) => (
                <div key={req.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-black uppercase italic">{req.vendor_profiles?.stall_name || 'New Stall'}</h3>
                      <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-md uppercase tracking-widest">
                        {req.vendor_profiles?.food_category || 'General'}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-black tracking-tighter italic">₹{req.total_amount}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Target Event</p>
                    <p className="text-sm font-bold text-gray-700">{req.events?.event_name}</p>
                  </div>

                  <div className="flex gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <button onClick={() => updateStatus(req.id, 'approved')} className="flex-1 bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-green-600 transition-colors">Approve</button>
                        <button onClick={() => updateStatus(req.id, 'declined')} className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Decline</button>
                      </>
                    ) : (
                      <div className={`w-full text-center py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest ${req.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {req.status === 'approved' ? '✅ Request Approved' : '❌ Request Declined'}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setActiveChat({ id: req.vendor_id, name: req.vendor_profiles?.stall_name })} className="w-full mt-3 bg-white border border-gray-100 text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    💬 Chat with Vendor
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-black text-black uppercase italic tracking-tighter mb-10">Live Fests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map(event => (
                <div key={event.id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:border-purple-600 transition-all group">
                  <h3 className="text-2xl font-black text-black uppercase italic mb-4 group-hover:text-purple-600 transition-colors">{event.event_name}</h3>
                  <div className="space-y-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <p>📅 {new Date(event.event_date).toLocaleDateString()}</p>
                    <p className="text-black">💰 Base Fee: ₹{event.base_stall_fee}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'finances' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-black text-black uppercase italic tracking-tighter mb-10">Revenue Hub</h2>
            <div className="bg-black text-white p-12 rounded-[48px] shadow-2xl bg-gradient-to-br from-black via-zinc-900 to-purple-900 italic">
              <p className="text-xs font-black text-purple-400 uppercase tracking-[0.4em] mb-4">Stall Revenue (Approved)</p>
              <h3 className="text-8xl font-black tracking-tighter">₹{totalRevenue.toLocaleString()}</h3>
              <div className="mt-12 flex gap-8 border-t border-white/10 pt-10">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Confirmed</p>
                  <p className="text-3xl font-black">{requests.filter(r => r.status === 'approved').length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pending</p>
                  <p className="text-3xl font-black">{requests.filter(r => r.status === 'pending').length}</p>
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