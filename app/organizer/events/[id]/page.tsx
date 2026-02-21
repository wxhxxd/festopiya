'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchEventDetails() {
      // 1. Fetch Event Info
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventData) {
        setEvent(eventData);

        // 2. Fetch Approved Bookings for THIS event only
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*')
          .eq('event_id', id)
          .eq('status', 'approved');

        if (bookingsData && bookingsData.length > 0) {
          // 3. Get Profiles for these specific vendors
          const { data: profilesData } = await supabase
            .from('vendor_profiles')
            .select('id, stall_name, food_category');

          const enriched = bookingsData.map(b => ({
            ...b,
            profile: profilesData?.find(p => p.id === b.vendor_id) || null
          }));
          setVendors(enriched);
        }
      }
      setLoading(false);
    }
    fetchEventDetails();
  }, [id, supabase]);

  if (loading) return <div className="p-10 text-center">Loading Fest Details...</div>;
  if (!event) return <div className="p-10 text-center">Event not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/organizer/dashboard" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-8">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">{event.event_name}</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Date</p>
              <p className="font-bold">{new Date(event.event_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Base Fee</p>
              <p className="font-bold text-green-600">₹{event.base_stall_fee}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Confirmed</p>
              <p className="font-bold">{vendors.length} Vendors</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirmed Stall Map</h2>
        <div className="grid gap-4">
          {vendors.length === 0 ? (
            <p className="text-gray-500 italic">No vendors have been approved for this specific event yet.</p>
          ) : (
            vendors.map((v) => (
              <div key={v.id} className="bg-white p-6 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="text-lg font-black text-gray-900">{v.profile?.stall_name || "Stall #" + v.id.substring(0,4)}</h3>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{v.profile?.food_category || "General Vendor"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-bold uppercase">Commission Earned</p>
                  <p className="text-xl font-bold text-green-600">₹{v.commission_amount}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}