// "use client";

// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   User as UserIcon,
//   CreditCard,
//   Shield,
//   MessageSquareIcon,
// } from "lucide-react";
// import { WhatsAppLogo } from "@/components/ui/svg";
// import { usePathname, useRouter, useSearchParams } from "next/navigation";
// import TabWhatsApp from "./tab-whatsapp";
// import TabProfile from "./tab-profile";
// import TabSubscription from "./subscription";
// import TabAutoreplyRules from "./tab-autoReply";
// import { strPascalCase } from "@/lib/utils/stringHandlers";
// import { TabSecurity } from "./tab-security";
// import { UserWithRelations } from "@/services/user/user.dto";

// const isWhatsAppEnabled = process.env.NEXT_PUBLIC_ENABLE_WHATSAPP_UI === "true";

// export default function SettingsClient({ user }: { user: UserWithRelations }) {
//   const searchParams = useSearchParams();
//   const tab = searchParams.get("tab");

//   const router = useRouter();
//   const pathname = usePathname();

//   const handleTabChange = (value: string) => {
//     router.push(`${pathname}?tab=${value}`, { scroll: false });
//   };

//   const tabs: { tabName: string; icon: React.ReactNode }[] = [
//     { tabName: "profile", icon: <UserIcon className="w-4 h-4" /> },
//     { tabName: "chatbots", icon: <WhatsAppLogo className="h-4 w-4" /> },
//     { tabName: "subscription", icon: <CreditCard className="w-4 h-4" /> },
//     { tabName: "auto-reply", icon: <MessageSquareIcon className="w-4 h-4" /> },
//     { tabName: "security", icon: <Shield className="w-4 h-4" /> },
//   ];

//   const activeTab = tabs.map(({ tabName }) => tabName).includes(tab as any)
//     ? tab!
//     : "profile";

//   return (
//     <Tabs
//       value={activeTab}
//       onValueChange={handleTabChange}
//       className="space-y-6"
//     >
//       <TabsList className="grid w-full grid-cols-5 lg:w-auto">
//         {tabs.map(({ tabName, icon }) => (
//           <TabsTrigger
//             key={tabName}
//             value={tabName}
//             className="flex items-center gap-2"
//           >
//             {icon}
//             <span className="hidden sm:inline">{strPascalCase(tabName)}</span>
//           </TabsTrigger>
//         ))}
//       </TabsList>

//       {/* Profile Tab */}
//       <TabsContent value="profile" className="space-y-6">
//         <TabProfile user={user} />
//       </TabsContent>

//       {/* WhatsApp Tab */}
//       <TabsContent value="chatbots" className="space-y-6">
//         <TabWhatsApp waba={user.waba} />
//       </TabsContent>

//       {/* Subscription Tab */}
//       <TabsContent value="subscription" className="space-y-6">
//         <TabSubscription />
//       </TabsContent>

//       {/* AutoReply Tab */}
//       <TabsContent value="auto-reply" className="space-y-4">
//         <TabAutoreplyRules />
//       </TabsContent>

//       {/* Security Tab */}
//       <TabsContent value="security" className="space-y-6">
//         <TabSecurity />
//       </TabsContent>
//     </Tabs>
//   );
// }

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User as UserIcon,
  CreditCard,
  Shield,
  MessageSquareIcon,
  Construction,
  Sparkles,
} from "lucide-react";
import { WhatsAppLogo } from "@/components/ui/svg";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TabWhatsApp from "./tab-whatsapp";
import TabProfile from "./tab-profile";
import TabSubscription from "./subscription";
import TabAutoreplyRules from "./tab-autoReply";
import { strPascalCase } from "@/lib/utils/stringHandlers";
import { TabSecurity } from "./tab-security";
import { UserWithRelations } from "@/services/user/user.dto";

const isWhatsAppEnabled = process.env.NEXT_PUBLIC_ENABLE_WHATSAPP_UI === "true";

export default function SettingsClient({ user }: { user: UserWithRelations }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = (value: string) => {
    router.push(`${pathname}?tab=${value}`, { scroll: false });
  };

  const tabs: {
    tabName: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    { tabName: "profile", icon: <UserIcon className="w-4 h-4" /> },
    {
      tabName: "chatbots",
      icon: <WhatsAppLogo className="h-4 w-4" />,
      badge: !isWhatsAppEnabled ? "Soon" : undefined, // Adds badge when disabled
    },
    { tabName: "subscription", icon: <CreditCard className="w-4 h-4" /> },
    { tabName: "auto-reply", icon: <MessageSquareIcon className="w-4 h-4" /> },
    { tabName: "security", icon: <Shield className="w-4 h-4" /> },
  ];

  const activeTab = tabs.map(({ tabName }) => tabName).includes(tab as any)
    ? tab!
    : "profile";

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="space-y-6"
    >
      <TabsList className="grid w-full grid-cols-5 lg:w-auto">
        {tabs.map(({ tabName, icon, badge }) => (
          <TabsTrigger
            key={tabName}
            value={tabName}
            className="flex items-center justify-center gap-1.5 relative"
          >
            {icon}
            <span className="hidden sm:inline">{strPascalCase(tabName)}</span>

            {/* Visual Badge / Hint */}
            {badge && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                {badge}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile" className="space-y-6">
        <TabProfile user={user} />
      </TabsContent>

      {/* WhatsApp / Chatbots Tab */}
      <TabsContent value="chatbots" className="space-y-6">
        {isWhatsAppEnabled ? (
          <TabWhatsApp waba={user.waba} />
        ) : (
          /* Under Development Placeholder */
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <div className="rounded-full bg-amber-500/10 p-3 text-amber-500 mb-4">
              <Construction className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold">Under Active Development</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              The Chatbots integration is currently being built and will be
              available in a future update.
            </p>
          </div>
        )}
      </TabsContent>

      {/* Subscription Tab */}
      <TabsContent value="subscription" className="space-y-6">
        <TabSubscription />
      </TabsContent>

      {/* AutoReply Tab */}
      <TabsContent value="auto-reply" className="space-y-4">
        <TabAutoreplyRules />
      </TabsContent>

      {/* Security Tab */}
      <TabsContent value="security" className="space-y-6">
        <TabSecurity />
      </TabsContent>
    </Tabs>
  );
}
