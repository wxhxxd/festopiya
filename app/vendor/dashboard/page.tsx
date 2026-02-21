'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ChatModal from '@/app/(auth)/components/ChatModal'; 
import Link from 'next/link';

type TabType = 'marketplace' | 'requests' | 'finances';

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('marketplace');
  
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);

  const [bookingModalEvent, setBookingModalEvent] = useState<any | null>(null);
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (eventsData) {
        setEvents(eventsData);
        setFilteredEvents(eventsData);
      }

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`*, events (event_name, event_date, base_stall_fee, organizer_id, contact_phone)`)
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsData) setMyBookings(bookingsData);
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (query === '') setFilteredEvents(events);
    else setFilteredEvents(events.filter((event) => event.event_name.toLowerCase().includes(query)));
  };

  const submitBookingRequest = async () => {
    if (!currentUserId || !bookingModalEvent) return;
    setIsSubmitting(true);
    const festopiyaCut = offerPrice * 0.05; 
    
    // Attempt to save the offer to the database
    const { error } = await supabase.from('bookings').insert([{
      event_id: bookingModalEvent.id, 
      vendor_id: currentUserId, 
      agreed_fee: offerPrice,      
      total_amount: offerPrice, 
      commission_amount: festopiyaCut, 
      status: 'pending' 
    }]);

    // THE FIX: This will pop up an alert telling us EXACTLY why it failed
    if (error) {
      alert("🚨 DATABASE ERROR: " + error.message);
      setIsSubmitting(false);
    } else {
      alert("✅ Offer sent successfully!");
      setBookingModalEvent(null);
      window.location.reload(); 
    }
  };

  // --- TAB RENDERERS ---

  const renderMarketplace = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Live Marketplace</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Discover premium fests</p>
        </div>
        <div className="w-full md:w-96 relative">
          <input 
            type="text" placeholder="Search for a fest..." value={searchQuery} onChange={handleSearch}
            className="w-full pl-5 pr-12 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
          />
          <span className="absolute right-5 top-4 text-gray-300 text-xl">🔍</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-24 md:pb-8">
        {filteredEvents.map((event) => {
          const alreadyApplied = myBookings.some(b => b.event_id === event.id);
          return (
            <div key={event.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-black text-gray-900 uppercase italic group-hover:text-blue-600 transition-colors">{event.event_name}</h3>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">Open</span>
                </div>
                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <span className="w-6 text-lg">📅</span> {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'TBA'}
                  </div>
                  <div className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <span className="w-6 text-lg">👥</span> {event.expected_footfall ? `${event.expected_footfall.toLocaleString()} Expected` : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Asking Price</p>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{event.base_stall_fee}</p>
                  {alreadyApplied ? (
                    <button disabled className="bg-gray-100 text-gray-400 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] cursor-not-allowed">Applied</button>
                  ) : (
                    <button onClick={() => { setBookingModalEvent(event); setOfferPrice(event.base_stall_fee); }} className="bg-black hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-md hover:shadow-lg">
                      Make Offer
                    </button>
                  )}
                </div>
                <button onClick={() => setActiveChat({ id: event.organizer_id, name: `Org: ${event.event_name}` })} className="w-full bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">
                  💬 Chat with Organizer
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-8">My Stall Requests</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24 md:pb-8">
        {myBookings.map((booking) => (
          <div key={booking.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:border-black transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-xl text-gray-900 uppercase italic">{booking.events?.event_name || 'Unknown Event'}</h3>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Offered: ₹{booking.total_amount}</p>
              </div>
              {booking.status === 'approved' && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">✅ Approved</span>}
              {booking.status === 'pending' && <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">⏳ Pending</span>}
              {booking.status === 'declined' && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">❌ Declined</span>}
            </div>
            {booking.events?.organizer_id && (
              <button onClick={() => setActiveChat({ id: booking.events.organizer_id, name: `Org: ${booking.events.event_name}` })} className="mt-4 w-full bg-gray-50 hover:bg-black hover:text-white text-gray-900 px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Open Messages
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderFinances = () => {
    const totalSpent = myBookings.filter(b => b.status === 'approved').reduce((sum, b) => sum + b.total_amount, 0);
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-8">Business Ledger</h2>
        <div className="bg-black text-white p-10 rounded-3xl shadow-xl bg-gradient-to-br from-black to-gray-800">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Invested in Stalls (Approved)</p>
          <h3 className="text-6xl font-black tracking-tighter italic mb-6">₹{totalSpent.toLocaleString()}</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest border-t border-gray-700 pt-6">Track your spending to calculate ROI after the fest.</p>
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
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ml-1">Vendor Panel</span>
        </div>
        <nav className="flex-1 space-y-3">
          <button onClick={() => setActiveTab('marketplace')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'marketplace' ? 'bg-black text-white shadow-lg shadow-black/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <span className="text-xl">🏪</span> Marketplace
          </button>
          <button onClick={() => setActiveTab('requests')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'requests' ? 'bg-black text-white shadow-lg shadow-black/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <span className="text-xl">🎟️</span> My Requests
          </button>
          <button onClick={() => setActiveTab('finances')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'finances' ? 'bg-black text-white shadow-lg shadow-black/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <span className="text-xl">📊</span> Ledger
          </button>
        </nav>
        <div className="pt-6 border-t border-gray-100 space-y-3">
          <Link href="/vendor/profile" className="w-full flex justify-center items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors">
            ⚙️ Edit Profile
          </Link>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
        <div className="flex justify-around items-center p-2">
          <button onClick={() => setActiveTab('marketplace')} className={`flex flex-col items-center p-3 rounded-xl transition-all ${activeTab === 'marketplace' ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="text-2xl mb-1">🏪</span>
            <span className="text-[8px] font-black uppercase tracking-widest">Market</span>
          </button>
          <button onClick={() => setActiveTab('requests')} className={`flex flex-col items-center p-3 rounded-xl transition-all ${activeTab === 'requests' ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="text-2xl mb-1">🎟️</span>
            <span className="text-[8px] font-black uppercase tracking-widest">Requests</span>
          </button>
          <button onClick={() => setActiveTab('finances')} className={`flex flex-col items-center p-3 rounded-xl transition-all ${activeTab === 'finances' ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="text-2xl mb-1">📊</span>
            <span className="text-[8px] font-black uppercase tracking-widest">Ledger</span>
          </button>
          <Link href="/vendor/profile" className="flex flex-col items-center p-3 rounded-xl text-gray-400">
            <span className="text-2xl mb-1">⚙️</span>
            <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
          </Link>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 relative z-10">
        {activeTab === 'marketplace' && renderMarketplace()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'finances' && renderFinances()}
      </main>

      {/* BOOKING MODAL */}
      {bookingModalEvent && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 uppercase italic mb-2">Send Offer</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{bookingModalEvent.event_name}</p>
            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Negotiated Price (₹)</label>
              <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(Number(e.target.value))} className="w-full text-3xl font-black text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setBookingModalEvent(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-xl font-black uppercase tracking-widest text-xs">Cancel</button>
              <button onClick={submitBookingRequest} disabled={isSubmitting || offerPrice <= 0} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg">{isSubmitting ? 'Sending...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT MODAL */}
      {activeChat && <ChatModal currentUserId={currentUserId} recipientId={activeChat.id} recipientName={activeChat.name} onClose={() => setActiveChat(null)} />}
    </div>
  );
}