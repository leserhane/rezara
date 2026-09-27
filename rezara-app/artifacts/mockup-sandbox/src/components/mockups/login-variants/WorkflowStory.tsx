import React from "react";
import { ArrowRight, CalendarPlus, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkflowStory() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-[#00C896] selection:text-white">
      {/* Header with Logo */}
      <header className="p-6 md:p-8 w-full max-w-6xl mx-auto flex justify-start">
        <div className="flex items-center gap-2">
          {/* Using text logo instead of image due to black background issue on light theme */}
          <div className="w-8 h-8 rounded bg-[#00C896] flex items-center justify-center">
            <span className="text-white font-bold text-lg leading-none">R</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Rezara
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 w-full max-w-6xl mx-auto">
        <div className="text-center mb-16 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
            How Rezara works
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium">
            Collect deposits in 3 simple steps
          </p>
        </div>

        {/* Workflow Steps Container */}
        <div className="relative w-full max-w-5xl mb-16">
          {/* Desktop Dotted Line Connector */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 border-t-2 border-dashed border-slate-200 -z-10 -translate-y-12"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center relative group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-6 shadow-sm border border-blue-100 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                <CalendarPlus className="w-6 h-6" />
              </div>
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 shadow-sm">
                1
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Create a Booking</h3>
              <p className="text-slate-500 leading-relaxed">
                Add customer details, date, and deposit amount.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center relative group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mb-6 shadow-sm border border-purple-100 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                <LinkIcon className="w-6 h-6" />
              </div>
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 shadow-sm">
                2
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Send a Payment Link</h3>
              <p className="text-slate-500 leading-relaxed">
                Customer receives a unique link and pays instantly via card.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center relative group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6 shadow-sm border border-emerald-100 group-hover:bg-[#00C896] group-hover:text-white transition-colors duration-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 shadow-sm">
                3
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Deposit Confirmed</h3>
              <p className="text-slate-500 leading-relaxed">
                You get notified, booking is confirmed automatically.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col items-center text-center">
          <Button 
            onClick={() => {}}
            size="lg"
            className="bg-[#00C896] hover:bg-[#00b386] text-white text-lg h-14 px-8 rounded-full font-semibold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 group"
          >
            Start accepting deposits
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <p className="mt-8 text-slate-500">
            Already have an account?{" "}
            <button className="font-semibold text-slate-900 hover:text-[#00C896] transition-colors underline decoration-slate-300 underline-offset-4 hover:decoration-[#00C896]">
              Sign in
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
