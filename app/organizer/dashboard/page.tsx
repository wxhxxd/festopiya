'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ChatModal from '@/app/(auth)/components/ChatModal'; 
import Link from 'next/link';

type TabType = 'fests' | 'requests' | 'revenue';

export default function OrganizerDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('fests');
  
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [vendorRequests, setVendorRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // 1. Fetch Fests created by this organizer
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });
        
      if (eventsData) setMyEvents(eventsData);

      // 2. Fetch Bookings (Without the strict vendor_profiles SQL join)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          events!inner (event_name, organizer_id)
        `)
        .eq('events.organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        alert("🚨 DB Error: " + bookingsError.message);
        setLoading(false);
        return;
      }

      // 3. The Bulletproof Manual Join: Match profiles to requests safely!
      if (bookingsData && bookingsData.length > 0) {
        const vendorIds = bookingsData.map(b => b.vendor_id);
        
        const { data: profilesData } = await supabase
          .from('vendor_profiles')
          .select('*')
          .in('id', vendorIds);

        const mergedBookings = bookingsData.map(booking => ({
          ...booking,
          vendor_profiles: profilesData?.find(p => p.id === booking.vendor_id) || null
        }));
        
        setVendorRequests(mergedBookings);
      } else {
        setVendorRequests([]);
      }
      
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (!error) {
      setVendorRequests(prev => 
        prev.map(req => req.id === bookingId ? { ...req, status: newStatus } : req)
      );
    } else {
      alert("Error updating status: " + error.message);
    }
  };

  // --- TAB RENDERERS ---

  const renderFests = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">My Fests</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage your active events</p>
        </div>
        <Link href="/organizer/create-event" className="bg-black hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
          + Host New Fest
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24 md:pb-8">
        {myEvents.length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-3xl border border-dashed border-gray-300 text-center">
            <p className="text-gray-500 font-bold uppercase tracking-widest mb-4">You haven't hosted any fests yet.</p>
          </div>
        ) : (
          myEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-black transition-colors group">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-black text-gray-900 uppercase italic">{event.event_name}</h3>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Active</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Base Price</p>
                  <p className="text-xl font-black text-gray-900">₹{event.base_stall_fee}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Expected Footfall</p>
                  <p className="text-xl font-black text-gray-900">{event.expected_footfall}</p>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                📅 {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date TBA'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-8">Vendor Requests</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24 md:pb-8">
        {vendorRequests.length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-3xl border border-dashed border-gray-300 text-center">
            <p className="text-gray-500 font-bold uppercase tracking-widest">No stall requests yet.</p>
          </div>
        ) : (
          vendorRequests.map((req) => (
            <div key={req.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-black text-xl text-gray-900 uppercase italic">{req.vendor_profiles?.stall_name || 'PENDING PROFILE'}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    Event: {req.events?.event_name}
                  </p>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">
                    {req.vendor_profiles?.food_category || 'Category TBA'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Offered Amount</p>
                  <p className="text-2xl font-black text-gray-900">₹{req.total_amount}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveChat({ id: req.vendor_id, name: req.vendor_profiles?.stall_name || 'Vendor' })}
                  className="flex-1 bg-gray-50 hover:bg-gray-200 text-gray-900 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  💬 Chat
                </button>
                <a 
                  href={req.vendor_profiles?.phone ? `tel:${req.vendor_profiles.phone}` : '#'}
                  className={`flex-1 flex justify-center items-center py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    req.vendor_profiles?.phone ? 'bg-gray-100 hover:bg-gray-300 text-gray-900' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  📞 Call
                </a>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                {req.status === 'pending' ? (
                  <>
                    <button onClick={() => handleUpdateStatus(req.id, 'approved')} className="flex-1 bg-black hover:bg-green-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
                      Accept Offer
                    </button>
                    <button onClick={() => handleUpdateStatus(req.id, 'declined')} className="flex-1 bg-white border-2 border-gray-200 hover:border-red-500 hover:text-red-600 text-gray-900 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
                      Decline
                    </button>
                  </>
                ) : (
                  <div className="w-full text-center py-3 rounded-xl bg-gray-50">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${req.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                      {req.status === 'approved' ? '✅ Offer Accepted' : '❌ Offer Declined'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderRevenue = () => {
    const grossRevenue = vendorRequests.filter(req => req.status === 'approved').reduce((sum, req) => sum + req.total_amount, 0);
    const platformFees = grossRevenue * 0.05;
    const netPayout = grossRevenue - platformFees;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-8">Revenue Tracker</h2>
        
        <div className="bg-black text-white p-10 rounded-3xl shadow-xl bg-gradient-to-br from-black to-gray-800 mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Net Earnings</p>
          <h3 className="text-6xl font-black tracking-tighter italic mb-2">₹{netPayout.toLocaleString()}</h3>
          <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Ready for Payout
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Gross Vendor Payments</p>
            <p className="text-3xl font-black text-gray-900">₹{grossRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Festopiya Platform Fee (5%)</p>
            <p className="text-3xl font-black text-red-500">- ₹{platformFees.toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 font-black text-gray-400 uppercase tracking-widest">LOADING DASHBOARD...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans selection:bg-blue-200">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 h-full p-6 z-20 shadow-sm">
        <div className="mb-12 mt-4">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic">FESTOPIYA</h1>
          <span className="bg-black text-white px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ml-1 shadow-md">Organizer</span>
        </div>
        <nav className="flex-1 space-y-3">
          <button onClick={() => setActiveTab('fests')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'fests' ? 'bg-black text-white shadow-lg shadow-black/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <span className="text-xl">🎪</span> My Fests
          </button>
          <button onClick={() => setActiveTab('requests')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'requests' ? 'bg-black text-white shadow-lg shadow-black/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <span className="text-xl">📥</span> Requests
          </button>
          <button onClick={() => setActiveTab('revenue')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'revenue' ? 'bg-black text-white shadow-lg shadow-black/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <span className="text-xl">💰</span> Revenue
          </button>
        </nav>
        <div className="pt-6 border-t border-gray-100 space-y-3">
          <button className="w-full flex justify-center items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-400 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors cursor-not-allowed">
            ⚙️ Settings (Coming Soon)
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
        <div className="flex justify-around items-center p-2">
          <button onClick={() => setActiveTab('fests')} className={`flex flex-col items-center p-3 rounded-xl transition-all ${activeTab === 'fests' ? 'text-black' : 'text-gray-400'}`}>
            <span className="text-2xl mb-1">🎪</span>
            <span className="text-[8px] font-black uppercase tracking-widest">Fests</span>
          </button>
          <button onClick={() => setActiveTab('requests')} className={`flex flex-col items-center p-3 rounded-xl transition-all ${activeTab === 'requests' ? 'text-black' : 'text-gray-400'}`}>
            <span className="text-2xl mb-1">📥</span>
            <span className="text-[8px] font-black uppercase tracking-widest">Requests</span>
          </button>
          <button onClick={() => setActiveTab('revenue')} className={`flex flex-col items-center p-3 rounded-xl transition-all ${activeTab === 'revenue' ? 'text-black' : 'text-gray-400'}`}>
            <span className="text-2xl mb-1">💰</span>
            <span className="text-[8px] font-black uppercase tracking-widest">Revenue</span>
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 relative z-10">
        {activeTab === 'fests' && renderFests()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'revenue' && renderRevenue()}
      </main>

      {/* CHAT MODAL */}
      {activeChat && <ChatModal currentUserId={currentUserId} recipientId={activeChat.id} recipientName={activeChat.name} onClose={() => setActiveChat(null)} />}
    </div>
  );
}