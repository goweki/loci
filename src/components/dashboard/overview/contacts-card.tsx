import { Users } from "lucide-react";

import { StatCard } from "@/components/dashboard/shared/stat-card";

import { ContactService } from "@/services/contact/contact.service";

export async function ContactsCard() {
  const contactService = await ContactService.create();
  const contacts = await contactService.getContacts();

  return <StatCard title="Contacts" value={contacts.length} icon={Users} />;
}
