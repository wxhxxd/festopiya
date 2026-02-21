import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-200">
      
      {/* NAVBAR */}
      <nav className="flex justify-between items-center p-6 md:px-12 bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="text-2xl font-black text-gray-900 tracking-tighter italic">
          FESTOPIYA
        </div>
        <div className="space-x-6">
          <Link href="/login" className="text-xs font-black text-gray-500 hover:text-gray-900 uppercase tracking-widest transition-colors">
            Log In
          </Link>
          <Link href="/register" className="bg-black hover:bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-md">
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-6xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center">
        
        <div className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-blue-100 animate-fade-in-up">
          The #1 College Fest Marketplace in Hyderabad
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-tight mb-6">
          Negotiate & Book Stalls. <br className="hidden md:block" />
          <span className="text-blue-600 italic">Without the Broker Hustle.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl font-medium mb-12 leading-relaxed">
          Festopiya connects top event organizers with the best food and retail vendors. Chat in real-time, send custom offers, and track your revenue all in one place.
        </p>

        {/* CALL TO ACTION BUTTONS WITH URL PARAMETERS */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/register?role=vendor" className="bg-black hover:bg-gray-800 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl hover:shadow-black/20 text-center flex flex-col items-center justify-center">
            <span>I am a Vendor</span>
            <span className="text-[9px] text-gray-400 mt-1">Look for stalls to book</span>
          </Link>
          <Link href="/register?role=organizer" className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all text-center flex flex-col items-center justify-center">
            <span>I am an Organizer</span>
            <span className="text-[9px] text-gray-500 mt-1">Host a college fest</span>
          </Link>
        </div>
        
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-8">
          Join premium fests like Tech Fusion and more.
        </p>
      </main>

      {/* FEATURES SECTION */}
      <section className="bg-white py-24 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Why Festopiya?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-green-50 p-10 rounded-3xl border border-green-100 hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-6">💬</div>
              <h3 className="text-xl font-black text-gray-900 uppercase italic mb-3">Live Negotiation</h3>
              <p className="text-gray-600 font-medium leading-relaxed">Don't just pay the asking price. Use our secure in-app messenger to chat with organizers and send custom counter-offers instantly.</p>
            </div>
            
            <div className="bg-blue-50 p-10 rounded-3xl border border-blue-100 hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-6">💸</div>
              <h3 className="text-xl font-black text-gray-900 uppercase italic mb-3">5% Flat Fee</h3>
              <p className="text-gray-600 font-medium leading-relaxed">Say goodbye to greedy middlemen. Organizers only pay a flat 5% platform fee on successfully confirmed stalls. Zero hidden charges.</p>
            </div>
            
            <div className="bg-gray-50 p-10 rounded-3xl border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-6">📊</div>
              <h3 className="text-xl font-black text-gray-900 uppercase italic mb-3">Smart Ledgers</h3>
              <p className="text-gray-600 font-medium leading-relaxed">Your dashboard automatically calculates gross sales, platform cuts, and your exact net payout so your math is always perfect.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-gray-400 py-16 text-center">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-3xl font-black text-white tracking-tighter italic mb-6 md:mb-0">
            FESTOPIYA
          </div>
          <p className="text-xs font-bold uppercase tracking-widest">
            Built for the hustle. © {new Date().getFullYear()} Festopiya.
          </p>
        </div>
      </footer>

    </div>
  );
}