import { getWhatsAppNotificationSetup } from "@/actions/whatsapp-notification.actions";
import { WhatsAppNotifications } from "@/components/dashboard/whatsapp-notifications";
import PageTitle from "@/components/ui/page-title";
import { isValidLanguage } from "@/lib/i18n";
import { Bell } from "lucide-react";

export default async function WhatsAppNotificationsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) return null;
  const setup = await getWhatsAppNotificationSetup();
  return <div className="space-y-6 p-6"><PageTitle icon={Bell} title="Customer notifications" description="Schedule approved WhatsApp templates for customers who have opted in." /><WhatsAppNotifications initialSetup={setup} /></div>;
}
