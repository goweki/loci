import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowRight, Bot, MessageCircle, MessagesSquare, Settings2, Users, Zap } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { getDashboardStatsSummary } from "@/actions/dashboard.actions";
import { RecentConversations } from "@/components/dashboard/overview/recent-conversations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const copy = {
  en: {
    eyebrow: "AI ASSISTANT · WHATSAPP",
    title: "Your customer conversations, handled with AI.",
    description: "Let your assistant answer questions, help customers, and keep every WhatsApp conversation moving. Pick up any chat whenever a personal touch is needed.",
    openInbox: "Open conversations",
    connect: "Set up WhatsApp",
    assistant: "AI assistant",
    assistantDescription: "Answers customer messages around the clock, using your business information.",
    whatsapp: "WhatsApp inbox",
    whatsappDescription: "Keep customer chats in one place and step in whenever you need to.",
    contacts: "Contacts",
    messages: "Messages",
    recent: "Recent conversations",
    recentDescription: "See what customers are asking and continue a conversation.",
    allConversations: "View inbox",
    gettingStarted: "Get started",
    stepOne: "Connect your WhatsApp number",
    stepTwo: "Teach your assistant about your business",
    stepThree: "Let it handle customer questions",
  },
  sw: {
    eyebrow: "MSAIDIZI WA AI · WHATSAPP",
    title: "Mazungumzo na wateja, yakisaidiwa na AI.",
    description: "Msaidizi wako anaweza kujibu maswali na kuwasaidia wateja kupitia WhatsApp. Endelea na mazungumzo mwenyewe unapohitajika.",
    openInbox: "Fungua mazungumzo",
    connect: "Sanidi WhatsApp",
    assistant: "Msaidizi wa AI",
    assistantDescription: "Hujibu ujumbe wa wateja wakati wowote kwa kutumia taarifa za biashara yako.",
    whatsapp: "Kikasha cha WhatsApp",
    whatsappDescription: "Simamia mazungumzo ya wateja sehemu moja na ujiunge unapohitaji.",
    contacts: "Anwani",
    messages: "Ujumbe",
    recent: "Mazungumzo ya hivi karibuni",
    recentDescription: "Angalia maswali ya wateja na uendelee na mazungumzo.",
    allConversations: "Angalia kikasha",
    gettingStarted: "Anza hapa",
    stepOne: "Unganisha nambari yako ya WhatsApp",
    stepTwo: "Mweleze msaidizi kuhusu biashara yako",
    stepThree: "Mruhusu ajibu maswali ya wateja",
  },
};

export default async function DashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const { lang } = await params;
  const t = copy[lang as keyof typeof copy] ?? copy.en;
  const stats = await getDashboardStatsSummary();
  const basePath = `/${lang}`;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-1 -top-9 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium tracking-wide">
            <Zap className="h-3.5 w-3.5" /> {t.eyebrow}
          </div>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-primary-foreground/80 sm:text-base">{t.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="gap-2">
              <Link href={`${basePath}/dashboard/conversations`}><MessageCircle className="h-4 w-4" />{t.openInbox}<ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
              <Link href={`${basePath}/settings`}>{t.connect}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="flex gap-4 p-5 sm:p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Bot className="h-5 w-5" /></div>
            <div><h2 className="font-semibold">{t.assistant}</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">{t.assistantDescription}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="flex gap-4 p-5 sm:p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-700"><MessagesSquare className="h-5 w-5" /></div>
            <div><h2 className="font-semibold">{t.whatsapp}</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">{t.whatsappDescription}</p></div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl"><CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted"><Users className="h-5 w-5 text-muted-foreground" /></div>
          <div><p className="text-sm text-muted-foreground">{t.contacts}</p><p className="text-2xl font-semibold">{stats.totalContacts}</p></div>
        </CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted"><MessageCircle className="h-5 w-5 text-muted-foreground" /></div>
          <div><p className="text-sm text-muted-foreground">{t.messages}</p><p className="text-2xl font-semibold">{stats.totalConversations}</p></div>
        </CardContent></Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div><h2 className="text-lg font-semibold">{t.recent}</h2><p className="text-sm text-muted-foreground">{t.recentDescription}</p></div>
            <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1"><Link href={`${basePath}/dashboard/conversations`}>{t.allConversations}<ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
          <RecentConversations conversations={stats.recentConversations} />
        </div>
        <Card className="h-fit rounded-2xl">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Settings2 className="h-5 w-5" /></div><h2 className="font-semibold">{t.gettingStarted}</h2></div>
            <ol className="space-y-4 text-sm">
              {[t.stepOne, t.stepTwo, t.stepThree].map((step, index) => <li key={step} className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{index + 1}</span><span className="pt-0.5 text-muted-foreground">{step}</span></li>)}
            </ol>
            <Button asChild variant="outline" className="mt-6 w-full"><Link href={`${basePath}/settings`}>{t.connect}</Link></Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
