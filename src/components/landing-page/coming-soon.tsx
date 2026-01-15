"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function ComingSoon() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date("2026-03-01T00:00:00").getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight">
            Coming Soon
          </h1>
          <p className="text-xl md:text-2xl text-purple-200">
            Something amazing is on its way
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {timeLeft.days}
              </div>
              <div className="text-sm text-purple-200 uppercase tracking-wider">
                Days
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {timeLeft.hours}
              </div>
              <div className="text-sm text-purple-200 uppercase tracking-wider">
                Hours
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {timeLeft.minutes}
              </div>
              <div className="text-sm text-purple-200 uppercase tracking-wider">
                Minutes
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {timeLeft.seconds}
              </div>
              <div className="text-sm text-purple-200 uppercase tracking-wider">
                Seconds
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 pt-8">
          <p className="text-purple-200">Get notified when we launch</p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
              Notify Me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
