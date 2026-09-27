import React from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card, CardContent } from "../../ui/card";
import { Avatar, AvatarFallback } from "../../ui/avatar";

export default function SocialProofLed() {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans">
      {/* LEFT PANEL - Social Proof */}
      <div className="flex-1 bg-[#F8F9FA] p-8 md:p-16 lg:p-24 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full space-y-12">
          
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              Trusted by the best.
            </h2>
            <p className="text-gray-600 text-lg">
              Join thousands of businesses securing their revenue.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-[#00C896]">2,400+</div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wider">Businesses</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-[#00C896]">50K</div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wider">Bookings/month</div>
            </div>
            <div className="space-y-1 col-span-2 mt-2">
              <div className="text-4xl font-extrabold text-[#00C896]">MAD 2M+</div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wider">Deposits Secured</div>
            </div>
          </div>

          {/* Testimonial */}
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-6 space-y-4">
              <p className="text-gray-700 font-medium leading-relaxed italic">
                "We reduced no-shows by 60% in the first month. The peace of mind alone is worth it, but the revenue impact is undeniable."
              </p>
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 border-2 border-[#00C896]/20">
                  <AvatarFallback className="bg-[#00C896]/10 text-[#00C896] font-bold">KB</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-bold text-gray-900">Karim B.</div>
                  <div className="text-xs text-gray-500">La Maison Restaurant</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avatar Stack */}
          <div className="flex items-center space-x-4 pt-4">
            <div className="flex -space-x-3">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">A</AvatarFallback>
              </Avatar>
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="bg-pink-100 text-pink-700 text-xs">M</AvatarFallback>
              </Avatar>
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">S</AvatarFallback>
              </Avatar>
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">J</AvatarFallback>
              </Avatar>
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">+9</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-sm font-medium text-gray-600">
              Join 2,400+ businesses
            </span>
          </div>

        </div>
      </div>

      {/* RIGHT PANEL - Sign In */}
      <div className="flex-1 bg-white p-8 md:p-16 lg:p-24 flex flex-col justify-center relative">
        <div className="max-w-md mx-auto w-full space-y-8">
          
          {/* Logo / Header */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-[#00C896] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl leading-none">R</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-[#00C896]">
                Rezara
              </span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Welcome back
              </h1>
              <p className="text-gray-500">
                Sign in to manage your bookings and deposits.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                className="h-11 border-gray-300 focus:border-[#00C896] focus:ring-[#00C896]"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <a href="#" className="text-sm font-medium text-[#00C896] hover:text-[#00A078] transition-colors">
                  Forgot password?
                </a>
              </div>
              <Input 
                id="password" 
                type="password" 
                className="h-11 border-gray-300 focus:border-[#00C896] focus:ring-[#00C896]"
              />
            </div>

            <Button 
              className="w-full h-12 text-base font-semibold bg-[#00C896] hover:bg-[#00A078] text-white transition-all shadow-sm hover:shadow-md"
              onClick={() => {}}
            >
              Sign in
            </Button>
          </div>

          <p className="text-center text-sm text-gray-600 pt-4">
            New to Rezara?{" "}
            <a href="#" className="font-semibold text-[#00C896] hover:text-[#00A078] transition-colors">
              Get started free &rarr;
            </a>
          </p>

        </div>
      </div>
    </div>
  );
}
