import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  MessageCircle,
  MessagesSquare,
  Users,
  Zap,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { getDashboardStatsSummary } from "@/actions/dashboard.actions";
import { getUserSubscription } from "@/actions/subscription.actions";
import { RecentConversations } from "@/components/dashboard/overview/recent-conversations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Language } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "YOUR AI WORKSPACE",
    title: "Better customer conversations start here.",
    description:
      "Your AI assistant helps customers get answers on WhatsApp, around the clock. Monitor conversations and step in whenever your personal touch is needed.",
    openInbox: "Open conversations",
    subscribe: "Choose a subscription",
    activeDescription:
      "Your assistant is ready to help. Open your inbox to review customer messages and continue conversations.",
    inactiveDescription:
      "Choose a subscription to activate your assistant and start managing customer conversations.",
    assistant: "AI assistant",
    assistantDescription:
      "Answers customer questions around the clock using your business information.",
    whatsapp: "WhatsApp messaging",
    whatsappDescription:
      "Manage customer conversations in one place and take over whenever needed.",
    overview: "Your activity",
    contacts: "Contacts",
    conversations: "Conversations",
    recent: "Recent conversations",
    recentDescription:
      "Catch up on customer messages and see what needs your attention.",
    allConversations: "View all",
    nextStep: "Your next step",
    activeNextTitle: "Stay on top of your inbox",
    activeNextDescription:
      "Review recent messages, respond to customers, and let your assistant handle routine questions.",
    inactiveNextTitle: "Get your assistant ready",
    inactiveNextDescription:
      "Choose a subscription to unlock your workspace and start assisting your customers.",
    ready: "Your workspace is active",
    subscriptionNote: "Manage your plan and subscription details in settings.",
    manageSubscription: "Manage subscription",
  },
  sw: {
    eyebrow: "JUKWAA LAKO LA AI",
    title: "Boresha mazungumzo na wateja wako.",
    description:
      "Msaidizi wako wa AI huwajibu wateja kupitia WhatsApp wakati wowote. Fuatilia mazungumzo na ujibu mwenyewe inapohitajika.",
    openInbox: "Fungua mazungumzo",
    subscribe: "Chagua mpango wa usajili",
    activeDescription:
      "Msaidizi wako yuko tayari kusaidia. Fungua kikasha ili kuona ujumbe na kuendelea na mazungumzo ya wateja.",
    inactiveDescription:
      "Chagua mpango wa usajili ili kuamilisha msaidizi wako na kuanza kusimamia mazungumzo ya wateja.",
    assistant: "Msaidizi wa AI",
    assistantDescription:
      "Hujibu maswali ya wateja wakati wowote kwa kutumia taarifa za biashara yako.",
    whatsapp: "Ujumbe wa WhatsApp",
    whatsappDescription:
      "Simamia mazungumzo ya wateja sehemu moja na ujibu mwenyewe inapohitajika.",
    overview: "Muhtasari wa shughuli",
    contacts: "Anwani",
    conversations: "Mazungumzo",
    recent: "Mazungumzo ya hivi karibuni",
    recentDescription:
      "Angalia ujumbe wa hivi karibuni na masuala yanayohitaji uangalizi wako.",
    allConversations: "Ona yote",
    nextStep: "Hatua inayofuata",
    activeNextTitle: "Fuatilia kikasha chako",
    activeNextDescription:
      "Kagua ujumbe mpya, wajibu wateja na umruhusu msaidizi wako kushughulikia maswali ya kawaida.",
    inactiveNextTitle: "Andaa msaidizi wako",
    inactiveNextDescription:
      "Chagua mpango wa usajili ili kufungua huduma zako na kuanza kuwasaidia wateja.",
    ready: "Huduma zako zimewashwa",
    subscriptionNote:
      "Dhibiti mpango wako na maelezo ya usajili kwenye mipangilio.",
    manageSubscription: "Dhibiti usajili",
  },
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/");

  const { lang } = await params;
  const t = copy[lang as keyof typeof copy] ?? copy.en;
  const basePath = `/${lang}`;

  const [stats, subscRes] = await Promise.all([
    getDashboardStatsSummary(),
    getUserSubscription(),
  ]);

  const subscription = subscRes.ok ? subscRes.data : null;
  const hasAccess = Boolean(subscription?.hasAccess);

  const primaryHref = hasAccess
    ? `${basePath}/dashboard/conversations`
    : `${basePath}/settings?tab=subscription`;

  const primaryLabel = hasAccess ? t.openInbox : t.subscribe;

  return (
    <div className="space-y-8 py-6">
      {/* Welcome and primary action */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 -z-10 h-72 w-72 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-1 -top-9 -z-10 h-52 w-52 rounded-full border border-white/10"
        />

        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium tracking-wide">
            <Zap className="h-3.5 w-3.5" />
            {t.eyebrow}
          </div>

          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.title}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-primary-foreground/80 sm:text-base">
            {t.description}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="gap-2">
              <Link href={primaryHref}>
                {hasAccess ? (
                  <MessageCircle className="h-4 w-4" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            {hasAccess && (
              <Button
                asChild
                variant="outline"
                className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              >
                <Link href={`${basePath}/settings?tab=subscription`}>
                  {t.manageSubscription}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Core features */}
      <section aria-label={t.eyebrow} className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="flex gap-4 p-5 sm:p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">{t.assistant}</h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {t.assistantDescription}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="flex gap-4 p-5 sm:p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-700">
              <MessagesSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">{t.whatsapp}</h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {t.whatsappDescription}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Activity overview */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t.overview}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="rounded-2xl">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.contacts}</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {stats.totalContacts}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t.conversations}
                </p>
                <p className="text-2xl font-semibold tabular-nums">
                  {stats.totalConversations}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent activity and contextual next step */}
      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <div className="min-w-0 space-y-3">
          <RecentConversations
            lng={lang as Language}
            conversations={stats.recentConversations}
          />
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {hasAccess ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Zap className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0">
                <h2 className="font-semibold">{t.nextStep}</h2>
                <p className="mt-1 text-sm font-medium">
                  {hasAccess ? t.activeNextTitle : t.inactiveNextTitle}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {hasAccess
                    ? t.activeNextDescription
                    : t.inactiveNextDescription}
                </p>
              </div>
            </div>

            <Button asChild className="mt-5 w-full gap-2">
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            {hasAccess && (
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {t.subscriptionNote}
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
