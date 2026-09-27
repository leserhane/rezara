import React from "react";
import { Check, ArrowRight, BarChart3, Users, CreditCard } from "lucide-react";

export default function DarkBillboard() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative overflow-hidden font-sans flex flex-col">
      {/* Subtle green atmospheric glow */}
      <div className="absolute -bottom-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[#00C896]/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[10%] -right-[20%] w-[50%] h-[50%] rounded-full bg-[#00C896]/5 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          {/* Using text logo as instructed due to black background on dark variant */}
          <span className="font-black text-3xl tracking-tight text-[#00C896]">
            Rezara
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Products</a>
          <a href="#" className="hover:text-white transition-colors">Solutions</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
          <button className="text-white hover:text-[#00C896] transition-colors">Sign In</button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-8 max-w-7xl mx-auto w-full gap-16 relative z-10 pb-20 pt-10">
        
        {/* Left Side: Hero Text */}
        <div className="flex-1 flex flex-col items-start max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#00C896]"></span>
            Now available in Morocco
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Secure every booking with a <span className="text-[#00C896]">payment link.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-lg leading-relaxed">
            Stop losing money on no-shows. Send an instant payment link via WhatsApp and get deposits confirmed before you reserve their spot.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => {}}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#00C896] hover:bg-[#00B386] text-black font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(0,200,150,0.3)]"
            >
              Get Started for Free
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium text-lg transition-colors border border-white/10">
              Talk to Sales
            </button>
          </div>
        </div>

        {/* Right Side: Flow Card */}
        <div className="flex-1 w-full max-w-md lg:max-w-none">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-3xl pointer-events-none" />
            
            <h3 className="text-xl font-medium text-white mb-8">How it works</h3>
            
            <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-6 before:w-px before:bg-white/10 before:-z-10">
              
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                  <span className="text-gray-400 font-mono text-sm">1</span>
                </div>
                <div className="pt-3">
                  <h4 className="text-base font-medium text-white">Create booking</h4>
                  <p className="text-sm text-gray-500 mt-1">Enter customer details and deposit amount in the dashboard.</p>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                  <span className="text-gray-400 font-mono text-sm">2</span>
                </div>
                <div className="pt-3">
                  <h4 className="text-base font-medium text-white">Send link</h4>
                  <p className="text-sm text-gray-500 mt-1">Customer receives a secure payment link via SMS or WhatsApp.</p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#00C896]/20 border border-[#00C896]/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,200,150,0.2)]">
                  <Check className="w-5 h-5 text-[#00C896]" />
                </div>
                <div className="pt-3">
                  <h4 className="text-base font-medium text-white">Deposit confirmed</h4>
                  <p className="text-sm text-[#00C896]/80 mt-1">Funds are secured and the reservation is locked in instantly.</p>
                </div>
              </div>
              
            </div>
          </div>
        </div>
        
      </main>

      {/* Bottom Stats Strip */}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          <div className="flex items-center gap-3 text-gray-400">
            <Users className="w-5 h-5 text-gray-500" />
            <div>
              <span className="block text-white font-semibold">2,400+</span>
              <span className="text-xs uppercase tracking-wider font-medium">Businesses</span>
            </div>
          </div>
          
          <div className="hidden sm:block w-px h-10 bg-white/10" />
          
          <div className="flex items-center gap-3 text-gray-400">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            <div>
              <span className="block text-white font-semibold">50,000+</span>
              <span className="text-xs uppercase tracking-wider font-medium">Bookings</span>
            </div>
          </div>
          
          <div className="hidden sm:block w-px h-10 bg-white/10" />
          
          <div className="flex items-center gap-3 text-gray-400">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <div>
              <span className="block text-white font-semibold">MAD 2M+</span>
              <span className="text-xs uppercase tracking-wider font-medium">Collected</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
