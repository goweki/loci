import ContactsComponent from "@/components/dashboard/contacts";
import { getContactsByUserId } from "@/data/contact";
import { getPhoneNumbersByUser } from "@/data/phoneNumber";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export default async function ContactsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const contacts = await getContactsByUserId(session.user.id);
  const phoneNumbers = await getPhoneNumbersByUser(session.user.id);
  return <ContactsComponent contacts={contacts} phoneNumbers={phoneNumbers} />;
}
