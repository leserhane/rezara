import React from 'react';

export default function CenteredMinimal() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      {/* Subtle background styling */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-100"></div>
      
      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[440px] px-10 py-16 mx-4 bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center text-center">
        
        {/* Logo Replacement: Text-based due to black background issues on white */}
        <div className="mb-14 flex flex-col items-center justify-center">
           <span className="text-[2.5rem] font-extrabold tracking-tighter" style={{ color: '#00C896' }}>
             Rezara.
           </span>
        </div>

        {/* Headings */}
        <div className="space-y-5 mb-14 w-full">
          <h1 className="text-3xl sm:text-[2rem] font-semibold tracking-tight text-slate-900 leading-[1.15]">
            Confirm bookings. Get paid instantly.
          </h1>
          <p className="text-slate-500 text-[1.05rem] leading-relaxed px-2">
            Sign in to manage your reservations and secure your payments seamlessly.
          </p>
        </div>

        {/* CTA Button */}
        <button 
          onClick={() => {}}
          className="w-full py-4 px-6 text-white text-lg font-medium rounded-2xl transition-all duration-300 hover:shadow-[0_8px_20px_-6px_rgba(0,200,150,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00C896]"
          style={{ backgroundColor: '#00C896' }}
        >
          Sign in to your account
        </button>
      </div>
    </div>
  );
}
