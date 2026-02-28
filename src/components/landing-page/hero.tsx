"use client";

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
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

const translations = {
  en: {
    supercharge: "Supercharge",
    customerEngagement: "Customer Engagement",
    description:
      "Seamlessly manage WhatsApp communications and CRM in one powerful platform — simplify workflows, build stronger relationships, and scale with ease.",
    startTrial: "Start free trial",
    watchDemo: "Watch Demo",
    features: {
      unifiedMessaging: "Unified Messaging",
      unifiedMessagingDescription: "All WhatsApp chats in one dashboard",
      crm: "Smart CRM",
      crmDescription: "Customer insights & automation",
      fast: "Lightning Fast",
      fastDescription: "Instant message delivery & responses",
    },
  },
  sw: {
    supercharge: "Boresha",
    customerEngagement: "Mwingiliano na wateja",
    description:
      "Simamia mawasiliano ya WhatsApp na CRM kwa urahisi katika jukwaa moja lenye nguvu — rahisisha kazi zako, jenga uhusiano imara zaidi, na kukuza biashara yako kwa urahisi.",
    startTrial: "Anza Jaribio la Bure",
    watchDemo: "Mfano wa Matumizi",
    features: {
      unifiedMessaging: "Ujumbe Uliounganishwa",
      unifiedMessagingDescription:
        "Gumzo zote za Kibiashara katika jukwaa moja",
      crm: "CRM Mahiri",
      crmDescription: "Uelewa wa wateja na uendeshaji wa kiotomatiki",
      fast: "Haraka Kama Umeme",
      fastDescription: "Ufikishaji na majibu ya ujumbe papo hapo",
    },
  },
};

export default function HeroSection() {
  const { language } = useI18n();
  const t = translations[language];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-bounce"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute animate-float opacity-60 ${
              i % 2 === 0 ? "text-blue-500" : "text-purple-500"
            }`}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 8}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          >
            {i % 3 === 0 ? (
              <MessageCircle className="w-6 h-6" />
            ) : i % 3 === 1 ? (
              <Users className="w-5 h-5" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12 mt-20">
        <div className="text-center">
          {/* Trust indicators */}
          {/* <div className="flex items-center justify-center gap-4 mb-8">
            <Badge
              variant="secondary"
              className="px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              WhatsApp Official Partner
            </Badge>
            <div className="hidden sm:flex items-center text-sm text-gray-600 dark:text-gray-400">
              <div className="flex text-yellow-400 mr-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span>Trusted by 10,000+ businesses</span>
            </div>
          </div> */}

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            <span className="inline-block">{t.supercharge}</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-800 bg-clip-text text-transparent animate-gradient">
              {t.customerEngagement}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-3xl mx-auto text-xl sm:text-2xl leading-relaxed text-gray-600 dark:text-gray-300 font-light">
            {t.description}
          </p>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${language}/sign-up`}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "text-lg bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-800 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl group"
              )}
            >
              {t.startTrial}
              <Zap className="ml-2 w-5 h-5 group-hover:animate-pulse" />
            </Link>

            {/* <Button variant="secondary" className="hover:scale-105" size="lg">
              <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              {t.watchDemo}
            </Button> */}
          </div>

          {/* Feature highlights */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
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
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <feature.icon className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-4 group-hover:animate-bounce" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bacground to-transparent pointer-events-none"></div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }

        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  );
}
