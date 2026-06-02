"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="bg-background py-20 md:py-28 relative overflow-hidden">
      {/* Decorative subtle ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container max-w-5xl mx-auto px-4 relative z-10">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-16 text-center shadow-xl">
          {/* Decorative integrated card mesh light */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />

          {/* Main Title Block */}
          <div className="max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-4">
              Ready to grow your business?
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Join thousands of merchants managing customer conversations,
              interactive catalogs, automated invoicing, and instant payments
              from a single unified dashboard.
            </p>
          </div>

          {/* Action Trigger Block */}
          <div className="flex flex-col items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 px-8 font-semibold text-base group shadow-md shadow-primary/20"
            >
              <Link href="/sign-up" className="flex items-center gap-2">
                Start Free 14-Day Trial
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>

            {/* Friction Reduction Microcopy */}
            <p className="text-xs text-muted-foreground/80 tracking-normal">
              No credit card required &bull; Cancel or change plans anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
