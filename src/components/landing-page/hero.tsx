"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  MessageCircle,
  Users,
  Zap,
  Sparkles,
  Play,
  CheckCircle,
  Star,
  type LucideIcon,
} from "lucide-react";

const translations: Record<
  "en" | "sw",
  {
    supercharge: string;
    customerEngagement: string;
    description: string;
    startTrial: string;
    watchDemo: string;
    features: {
      unifiedMessaging: string;
      unifiedMessagingDescription: string;
      crm: string;
      crmDescription: string;
      fast: string;
      fastDescription: string;
    };
  }
> = {
  en: {
    supercharge: "Supercharge Your Sales via",
    customerEngagement: "Conversational Commerce",
    description:
      "Seamlessly manage WhatsApp communications, inventory catalogs, and instant payments inside one dashboard. Simplify workflows, build trust, and scale with ease.",
    startTrial: "Start Free 14-Day Trial",
    watchDemo: "Watch Demo",
    features: {
      unifiedMessaging: "Unified Inbox",
      unifiedMessagingDescription:
        "All WhatsApp customer chats in one clear view.",
      crm: "Chat CRM Profiles",
      crmDescription: "Automate tracking customer insights & purchase data.",
      fast: "Lightning Execution",
      fastDescription: "Instant payment requests & balance receipts.",
    },
  },
  sw: {
    supercharge: "Boresha Mauzo Yako Kupitia",
    customerEngagement: "Biashara ya Mazungumzo",
    description:
      "Simamia mawasiliano ya WhatsApp, orodha ya bidhaa, na malipo ya haraka katika jukwaa moja. Rahisisha kazi zako, jenga uaminifu, na kukuza biashara kwa urahisi.",
    startTrial: "Anza Jaribio la Bure",
    watchDemo: "Angalia Mfano",
    features: {
      unifiedMessaging: "Ujumbe Uliounganishwa",
      unifiedMessagingDescription: "Gumzo zote za wateja katika jukwaa moja.",
      crm: "CRM Mahiri ya Chat",
      crmDescription: "Uelewa wa wateja na data zao kiotomatiki.",
      fast: "Kasi ya Umeme",
      fastDescription: "Ufikishaji wa ankara na malipo papo hapo.",
    },
  },
};

export default function HeroSection() {
  const { language } = useI18n();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background pt-24 pb-16 md:py-32 border-b border-border">
      {/* Structural Ambient Background Radial Blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Trust Badging Indicators Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 md:mb-8 animate-fade-in">
          <Badge
            variant="outline"
            className="px-3 py-1.5 bg-primary/5 border-primary/20 text-primary flex items-center gap-1.5 font-medium rounded-full text-xs"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Meta Cloud Integration
          </Badge>
          <div className="flex items-center text-xs font-medium text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/50">
            <div className="flex text-amber-500 mr-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <span>Trusted by growing merchants</span>
          </div>
        </div>

        {/* Hero Copy Engine */}
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            <span className="block text-foreground/90 font-bold text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-4 tracking-normal">
              {t.supercharge}
            </span>
            <span className="bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
              {t.customerEngagement}
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed text-muted-foreground font-normal">
            {t.description}
          </p>
        </div>

        {/* Unified Call to Action Triggers */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto h-12 px-8 font-semibold text-base shadow-lg shadow-primary/20 group transition-all duration-200 hover:scale-[1.01]"
          >
            <Link
              href={`/${language}/sign-up`}
              className="flex items-center gap-2"
            >
              {t.startTrial}
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </Button>

          {/* <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto h-12 px-8 font-semibold text-base border-border bg-background hover:bg-muted text-foreground transition-all duration-200 hover:scale-[1.01]"
          >
            <Play className="mr-2 w-4 h-4 fill-muted-foreground text-muted-foreground stroke-[1.5]" />
            {t.watchDemo}
          </Button> */}
        </div>

        {/* Feature Highlights Grid Matrix */}
        <div className="mt-20 md:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: MessageCircle,
              title: t.features.unifiedMessaging,
              desc: t.features.unifiedMessagingDescription,
            },
            {
              icon: Users,
              title: t.features.crm,
              desc: t.features.crmDescription,
            },
            {
              icon: Zap,
              title: t.features.fast,
              desc: t.features.fastDescription,
            },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative rounded-2xl border border-border/80 bg-card/40 p-6 text-center
                           hover:bg-card hover:border-border transition-all duration-300 ease-out
                           hover:shadow-md hover:-translate-y-0.5"
              >
                <div
                  className="w-10 h-10 rounded-xl bg-background border border-border 
                                flex items-center justify-center text-muted-foreground mx-auto mb-4
                                group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20
                                transition-all duration-300"
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-foreground mb-1 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Synchronized Bottom Fade masking overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
