// import ContactsComponent from "@/components/dashboard/contacts";
// import { getContactsByUserId } from "@/data/contact";
// import { getPhoneNumbersByUser } from "@/data/phoneNumber";
// import { getUserById } from "@/data/user";
// import { authOptions } from "@/lib/auth";
// import { getServerSession } from "next-auth";

// export default async function ContactsPage() {
//   const session = await getServerSession(authOptions);
//   if (!session) return null;

//   const contacts = await getContactsByUserId(session.user.id);
//   const phoneNumbers = await getPhoneNumbersByUser(session.user.id);
//   const wabaAccount = (await getUserById(session.user.id))?.waba || null;

//   return <ContactsComponent wabaAccount={wabaAccount} contacts={contacts} />;
// }

import { getUserByIdAction } from "@/actions/user.actions";
import ContactsComponent from "@/components/__dashboard/contacts";
import { getContactsByUserId } from "@/data/contact";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/lib/prisma/generated";
import { getServerSession } from "next-auth";

export default async function ContactsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const contacts = await getContactsByUserId(session.user.id);
  const resUserWithWaba = await getUserByIdAction(session.user.id, {
    waba: {
      include: {
        phoneNumbers: true,
        templates: true,
      },
    },
  });

  let userWithWaba: Prisma.UserGetPayload<{
    include: {
      waba: {
        include: {
          phoneNumbers: true;
          templates: true;
        };
      };
    };
  }> | null = null;
  let wabaAccount: Prisma.WabaAccountGetPayload<{
    include: {
      phoneNumbers: true;
      templates: true;
    };
  }> | null = null;

  if (resUserWithWaba.ok) userWithWaba = resUserWithWaba.data;
  if (userWithWaba) wabaAccount = userWithWaba.waba;

  return <ContactsComponent wabaAccount={wabaAccount} contacts={contacts} />;
}
