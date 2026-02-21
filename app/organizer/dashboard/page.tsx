'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import ChatModal from '@/app/(auth)/components/ChatModal'; 

export default function OrganizerDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [confirmedVendors, setConfirmedVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
        const eventIds = eventsData.map(e => e.id);
        
        if (eventIds.length > 0) {
          const { data: bookingsData } = await supabase
            .from('bookings')
            .select('*')
            .in('event_id', eventIds);
            
          if (bookingsData) {
            const { data: profilesData } = await supabase
              .from('vendor_profiles')
              .select('id, stall_name, food_category');

            const enrichedBookings = bookingsData.map(booking => {
              const profile = profilesData?.find(p => p.id === booking.vendor_id);
              const event = eventsData.find(e => e.id === booking.event_id); // Find the original event
              
              const offerAmount = booking.agreed_fee || 0;
              const originalFee = event?.base_stall_fee || offerAmount;
              
              // NEW: Check if the vendor negotiated the price down
              const isNegotiated = offerAmount !== originalFee;

              const festopiyaCommission = offerAmount * 0.05; 
              const organizerNet = offerAmount - festopiyaCommission;

              return {
                ...booking,
                math_gross: offerAmount,
                math_fee: festopiyaCommission,
                math_net: organizerNet,
                original_fee: originalFee,
                is_negotiated: isNegotiated,
                event_name: event?.event_name || 'Unknown Event',
                vendor_profiles: profile || null
              };
            });

            setRequests(enrichedBookings.filter(b => b.status === 'pending'));
            setConfirmedVendors(enrichedBookings.filter(b => b.status === 'approved'));
          }
        }
      }
      setLoading(false);
    }
    fetchDashboardData();
  }, [supabase]);

  const handleRequest = async (bookingId: string, action: 'approved' | 'declined') => {
    const { error } = await supabase.from('bookings').update({ status: action }).eq('id', bookingId);
    if (error) alert("Error: " + error.message);
    else window.location.reload(); 
  };

  const totalGross = confirmedVendors.reduce((acc, curr) => acc + curr.math_gross, 0);
  const totalFees = confirmedVendors.reduce((acc, curr) => acc + curr.math_fee, 0);
  const totalNet = confirmedVendors.reduce((acc, curr) => acc + curr.math_net, 0);

  if (loading) return <div className="p-8 text-center font-black text-gray-400">LOADING HUB...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-10 border-b-4 border-black pb-6">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic">ORGANIZER HUB</h1>
          <Link href="/organizer/create-event" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-blue-700 shadow-xl transition-all">
            + CREATE NEW FEST
          </Link>
        </div>

        {/* REVENUE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross Sales</p>
            <p className="text-4xl font-black text-gray-900 mt-2">₹{totalGross}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100">
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Festopiya Platform Fee (5%)</p>
            <p className="text-4xl font-black text-orange-600 mt-2">- ₹{totalFees}</p>
          </div>
          <div className="bg-black p-8 rounded-3xl shadow-2xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Net Payout</p>
            <p className="text-4xl font-black text-white mt-2">₹{totalNet}</p>
          </div>
        </div>

        {/* NEGOTIATION & PENDING REQUESTS */}
        {requests.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tighter">Stall Offers</h2>
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className={`bg-white p-6 rounded-2xl border-l-8 flex justify-between items-center shadow-md ${req.is_negotiated ? 'border-purple-500' : 'border-blue-600'}`}>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-gray-900 text-xl uppercase italic">
                        {req.vendor_profiles?.stall_name || "PENDING PROFILE"}
                      </p>
                      {/* NEW: Explicit Warning if the price was changed! */}
                      {req.is_negotiated && (
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">
                          Negotiated Offer
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs font-bold text-gray-400 uppercase mt-2">
                      Fest: {req.event_name}
                    </p>
                    
                    <div className="mt-1">
                      {req.is_negotiated ? (
                        <p className="text-sm font-bold text-gray-900">
                          Vendor Offered: <span className="text-purple-600 text-lg font-black">₹{req.math_gross}</span> 
                          <span className="line-through text-gray-400 ml-2 text-xs">₹{req.original_fee}</span>
                        </p>
                      ) : (
                        <p className="text-sm font-bold text-gray-900">
                          Stall Fee: ₹{req.math_gross}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Your Net Payout: <span className={req.is_negotiated ? 'text-purple-600' : 'text-blue-600'}>₹{req.math_net}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Organizer can chat back to counter-offer! */}
                    <button 
                      onClick={() => setActiveChat({ id: req.vendor_id, name: req.vendor_profiles?.stall_name || 'Vendor' })}
                      className="bg-gray-100 hover:bg-black hover:text-white text-gray-900 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Chat / Counter
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => handleRequest(req.id, 'declined')} className="bg-red-50 hover:bg-red-500 hover:text-white text-red-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Reject</button>
                      <button onClick={() => handleRequest(req.id, 'approved')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all">Accept</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE EVENTS */}
        <div className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tighter">Your Active Fests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <Link href={`/organizer/events/${event.id}`} key={event.id} className="group">
                <div className="bg-white p-8 rounded-3xl border border-gray-200 group-hover:border-black transition-all shadow-sm group-hover:shadow-2xl cursor-pointer">
                  <h3 className="text-2xl font-black text-gray-900 uppercase italic group-hover:text-blue-600 transition-colors">{event.event_name}</h3>
                  <div className="flex justify-between items-center mt-6">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Base Stall Fee: ₹{event.base_stall_fee}</p>
                    <span className="text-blue-600 font-black text-sm">MANAGE VENDORS →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* LEDGER TABLE */}
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tighter">Confirmed Vendor Ledger</h2>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stall Vendor</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Agreed Price</th>
                  <th className="p-6 text-[10px] font-black text-green-500 uppercase tracking-widest text-right">Net Payout</th>
                  <th className="p-6 text-[10px] font-black text-blue-500 uppercase tracking-widest text-right">Comms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {confirmedVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-6">
                      <p className="font-black text-gray-900 uppercase italic text-sm">{v.vendor_profiles?.stall_name || "GUEST"}</p>
                      {v.is_negotiated && <p className="text-[9px] font-bold text-purple-500 uppercase mt-1">Negotiated Rate</p>}
                    </td>
                    <td className="p-6 font-bold text-gray-900 text-sm">₹{v.math_gross}</td>
                    <td className="p-6 font-black text-green-600 text-right">₹{v.math_net}</td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => setActiveChat({ id: v.vendor_id, name: v.vendor_profiles?.stall_name || 'Vendor' })}
                        className="bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                      >
                        Message
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {activeChat && (
        <ChatModal 
          currentUserId={currentUserId}
          recipientId={activeChat.id}
          recipientName={activeChat.name}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}