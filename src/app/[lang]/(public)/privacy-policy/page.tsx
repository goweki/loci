"use client";

import { useI18n } from "@/lib/i18n";

// Translation object
const translations = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last Updated: November 9, 2025",
    introduction: {
      title: "Introduction",
      content:
        "Welcome to LOCi. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.",
    },
    informationWeCollect: {
      title: "Information We Collect",
      personalInfo: {
        title: "Personal Information",
        items: [
          "Name and email address",
          "Phone number for WhatsApp Business integration",
          "Account credentials (securely hashed passwords)",
          "Profile images",
          "Payment information (processed securely through third-party providers)",
        ],
      },
      messageData: {
        title: "Message and Communication Data",
        items: [
          "WhatsApp messages (text, images, documents, audio, video, location, contacts)",
          "Contact information of your message recipients",
          "Message timestamps and delivery status",
          "Auto-reply rules and configurations",
        ],
      },
      technicalData: {
        title: "Technical Data",
        items: [
          "Session information and authentication tokens",
          "Webhook events and API interactions",
          "Usage patterns and feature utilization",
          "Payment transaction records",
        ],
      },
    },
    howWeUse: {
      title: "How We Use Your Information",
      items: [
        "To provide and maintain our messaging service",
        "To manage your WhatsApp Business phone numbers",
        "To process and deliver messages to your contacts",
        "To handle auto-reply rules and automated responses",
        "To manage your subscription and process payments",
        "To provide customer support",
        "To improve our services and develop new features",
        "To detect and prevent fraud or abuse",
        "To comply with legal obligations",
      ],
    },
    dataStorage: {
      title: "Data Storage and Security",
      content:
        "We store your data securely using industry-standard PostgreSQL databases with encryption. Your password is hashed using secure algorithms. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
    },
    dataSharingTitle: "Data Sharing and Third Parties",
    dataSharing: {
      whatsapp: {
        title: "WhatsApp Business API",
        content:
          "We use the WhatsApp Business API to send and receive messages. Your messages are processed through WhatsApp's infrastructure in accordance with their privacy policy.",
      },
      payment: {
        title: "Payment Processors",
        content:
          "Payment information is processed through secure third-party payment providers (including M-Pesa for Kenyan payments). We do not store complete credit card information.",
      },
      oauth: {
        title: "OAuth Providers",
        content:
          "If you sign in using OAuth providers (Google, etc.), we receive basic profile information as permitted by your authorization.",
      },
      legal: {
        title: "Legal Requirements",
        content:
          "We may disclose your information if required by law or in response to valid legal requests.",
      },
    },
    dataRetention: {
      title: "Data Retention",
      content:
        "We retain your personal information for as long as your account is active or as needed to provide services. Messages are retained according to your subscription plan. You can request deletion of your data at any time, subject to legal retention requirements.",
    },
    yourRights: {
      title: "Your Rights",
      items: [
        "Access your personal information",
        "Correct inaccurate data",
        "Request deletion of your data",
        "Export your data",
        "Opt-out of marketing communications",
        "Suspend or delete your account",
      ],
    },
    subscriptionData: {
      title: "Subscription and Billing",
      content:
        "We collect and store subscription information including plan details, payment history, and usage limits. This information is used to manage your service access and billing.",
    },
    internationalTransfers: {
      title: "International Data Transfers",
      content:
        "Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers.",
    },
    children: {
      title: "Children's Privacy",
      content:
        "Our service is not intended for users under 18 years of age. We do not knowingly collect information from children.",
    },
    changes: {
      title: "Changes to This Privacy Policy",
      content:
        "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last Updated' date.",
    },
    contact: {
      title: "Contact Us",
      content:
        "If you have questions about this Privacy Policy or our data practices, please contact us at:",
    },
  },
  sw: {
    title: "Sera ya Faragha",
    lastUpdated: "Ilisasishwa Mwisho: Novemba 9, 2025",
    introduction: {
      title: "Utangulizi",
      content:
        "Karibu kwenye jukwaa letu la ujumbe wa WhatsApp Business. Tumejitolea kulinda faragha yako na kuhakikisha usalama wa taarifa zako binafsi. Sera hii ya Faragha inaelezea jinsi tunavyokusanya, kutumia, kufichua, na kulinda taarifa zako unapotumia huduma yetu.",
    },
    informationWeCollect: {
      title: "Taarifa Tunazokusanya",
      personalInfo: {
        title: "Taarifa Binafsi",
        items: [
          "Jina na anwani ya barua pepe",
          "Nambari ya simu kwa ajili ya muunganisho wa WhatsApp Business",
          "Hati za akaunti (nenosiri lililohifadhiwa kwa usalama)",
          "Picha za wasifu",
          "Taarifa za malipo (zinachakatwa kwa usalama kupitia watoa huduma wa tatu)",
        ],
      },
      messageData: {
        title: "Ujumbe na Data ya Mawasiliano",
        items: [
          "Ujumbe wa WhatsApp (maandishi, picha, hati, sauti, video, eneo, mawasiliano)",
          "Taarifa za mawasiliano ya wapokeaji wa ujumbe wako",
          "Muda wa ujumbe na hali ya utoaji",
          "Sheria za kujibu kiotomatiki na usanidi",
        ],
      },
      technicalData: {
        title: "Data ya Kiufundi",
        items: [
          "Taarifa za kipindi na tokeni za uthibitishaji",
          "Matukio ya webhook na mwingiliano wa API",
          "Mifumo ya matumizi na matumizi ya vipengele",
          "Rekodi za muamala wa malipo",
        ],
      },
    },
    howWeUse: {
      title: "Jinsi Tunavyotumia Taarifa Zako",
      items: [
        "Kutoa na kudumisha huduma yetu ya ujumbe",
        "Kusimamia nambari zako za simu za WhatsApp Business",
        "Kuchakata na kutuma ujumbe kwa anwani zako",
        "Kushughulikia sheria za kujibu kiotomatiki na majibu ya kiotomatiki",
        "Kusimamia usajili wako na kuchakata malipo",
        "Kutoa msaada kwa wateja",
        "Kuboresha huduma zetu na kuendeleza vipengele vipya",
        "Kugundua na kuzuia ulaghai au matumizi mabaya",
        "Kuzingatia majukumu ya kisheria",
      ],
    },
    dataStorage: {
      title: "Uhifadhi wa Data na Usalama",
      content:
        "Tunahifadhi data yako kwa usalama kwa kutumia hifadhidata za PostgreSQL za kiwango cha viwanda zenye usimbaji. Nenosiri lako limehifadhiwa kwa kutumia algoriti salama. Tunatekeleza hatua za kiufundi na za shirika zinazofaa kulinda taarifa zako binafsi dhidi ya upatikanaji usioidhinishwa, mabadiliko, ufichuzi, au uharibifu.",
    },
    dataSharingTitle: "Kushiriki Data na Wahusika wa Tatu",
    dataSharing: {
      whatsapp: {
        title: "API ya WhatsApp Business",
        content:
          "Tunatumia API ya WhatsApp Business kutuma na kupokea ujumbe. Ujumbe wako unachakatwa kupitia miundombinu ya WhatsApp kulingana na sera yao ya faragha.",
      },
      payment: {
        title: "Wachakataji wa Malipo",
        content:
          "Taarifa za malipo zinachakatwa kupitia watoa huduma wa tatu wa malipo (ikiwa ni pamoja na M-Pesa kwa malipo ya Kenya). Hatuhifadhi taarifa kamili za kadi ya mkopo.",
      },
      oauth: {
        title: "Watoa Huduma wa OAuth",
        content:
          "Ukiingia kwa kutumia watoa huduma wa OAuth (Google, n.k.), tunapokea taarifa za msingi za wasifu kama inavyoruhusiwa na idhini yako.",
      },
      legal: {
        title: "Mahitaji ya Kisheria",
        content:
          "Tunaweza kufichua taarifa zako ikiwa inahitajika kisheria au kujibu maombi halali ya kisheria.",
      },
    },
    dataRetention: {
      title: "Uhifadhi wa Data",
      content:
        "Tunahifadhi taarifa zako binafsi kwa muda akaunti yako ikiwa hai au kama inavyohitajika kutoa huduma. Ujumbe unahifadhiwa kulingana na mpango wako wa usajili. Unaweza kuomba ufutwe wa data yako wakati wowote, kutegemea mahitaji ya kisheria ya uhifadhi.",
    },
    yourRights: {
      title: "Haki Zako",
      items: [
        "Kupata taarifa zako binafsi",
        "Kusahihisha data isiyo sahihi",
        "Kuomba ufutwe wa data yako",
        "Kusafirisha data yako",
        "Kukataa mawasiliano ya uuzaji",
        "Kusimamisha au kufuta akaunti yako",
      ],
    },
    subscriptionData: {
      title: "Usajili na Malipo",
      content:
        "Tunakusanya na kuhifadhi taarifa za usajili ikiwa ni pamoja na maelezo ya mpango, historia ya malipo, na mipaka ya matumizi. Taarifa hii inatumika kudhibiti upatikanaji wa huduma yako na malipo.",
    },
    internationalTransfers: {
      title: "Uhamisho wa Data Kimataifa",
      content:
        "Taarifa zako zinaweza kuhamishwa na kuchakatwa katika nchi tofauti na nchi yako ya makazi. Tunahakikisha ulinzi unaofaa upo kwa uhamisho kama huo.",
    },
    children: {
      title: "Faragha ya Watoto",
      content:
        "Huduma yetu haikusudiwi kwa watumiaji chini ya miaka 18. Hatukusanyi taarifa kutoka kwa watoto kwa makusudi.",
    },
    changes: {
      title: "Mabadiliko ya Sera hii ya Faragha",
      content:
        "Tunaweza kusasisha Sera hii ya Faragha mara kwa mara. Tutakujulisha kuhusu mabadiliko yoyote kwa kuchapisha Sera mpya ya Faragha kwenye ukurasa huu na kusasisha tarehe ya 'Ilisasishwa Mwisho'.",
    },
    contact: {
      title: "Wasiliana Nasi",
      content:
        "Ikiwa una maswali kuhusu Sera hii ya Faragha au mazoea yetu ya data, tafadhali wasiliana nasi kwa:",
    },
  },
};

export default function PrivacyPolicy() {
  const { language, setLanguage } = useI18n();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-background rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">{t.title}</h1>
          <p className="text-muted-foreground text-sm">{t.lastUpdated}</p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Introduction */}
          <Section title={t.introduction.title}>
            <p className="text-muted-foreground leading-relaxed">
              {t.introduction.content}
            </p>
          </Section>

          {/* Information We Collect */}
          <Section title={t.informationWeCollect.title}>
            <SubSection title={t.informationWeCollect.personalInfo.title}>
              <List items={t.informationWeCollect.personalInfo.items} />
            </SubSection>

            <SubSection title={t.informationWeCollect.messageData.title}>
              <List items={t.informationWeCollect.messageData.items} />
            </SubSection>

            <SubSection title={t.informationWeCollect.technicalData.title}>
              <List items={t.informationWeCollect.technicalData.items} />
            </SubSection>
          </Section>

          {/* How We Use Your Information */}
          <Section title={t.howWeUse.title}>
            <List items={t.howWeUse.items} />
          </Section>

          {/* Data Storage */}
          <Section title={t.dataStorage.title}>
            <p className="text-muted-foreground leading-relaxed">
              {t.dataStorage.content}
            </p>
          </Section>

          {/* Data Sharing */}
          <Section title={t.dataSharingTitle}>
            <SubSection title={t.dataSharing.whatsapp.title}>
              <p className="text-muted-foreground leading-relaxed">
                {t.dataSharing.whatsapp.content}
              </p>
            </SubSection>

            <SubSection title={t.dataSharing.payment.title}>
              <p className="text-muted-foreground leading-relaxed">
                {t.dataSharing.payment.content}
              </p>
            </SubSection>

            <SubSection title={t.dataSharing.oauth.title}>
              <p className="text-muted-foreground leading-relaxed">
                {t.dataSharing.oauth.content}
              </p>
            </SubSection>

            <SubSection title={t.dataSharing.legal.title}>
              <p className="text-muted-foreground leading-relaxed">
                {t.dataSharing.legal.content}
              </p>
            </SubSection>
          </Section>

          {/* Data Retention */}
          <Section title={t.dataRetention.title}>
            <p className="text-muted-foreground leading-relaxed">
              {t.dataRetention.content}
            </p>
          </Section>

          {/* Your Rights */}
          <Section title={t.yourRights.title}>
            <List items={t.yourRights.items} />
          </Section>

          {/* Subscription Data */}
          <Section title={t.subscriptionData.title}>
            <p className="text-muted-foreground leading-relaxed">
              {t.subscriptionData.content}
            </p>
          </Section>

          {/* International Transfers */}
          <Section title={t.internationalTransfers.title}>
            <p className="text-muted-foreground leading-relaxed">
              {t.internationalTransfers.content}
            </p>
          </Section>

          {/* Children's Privacy */}
          <Section title={t.children.title}>
            <p className="text-muted-foreground leading-relaxed">
              {t.children.content}
            </p>
          </Section>

          {/* Changes to Policy */}
          <Section title={t.changes.title}>
            <p className="text-muted-foreground leading-relaxed">
              {t.changes.content}
            </p>
          </Section>

          {/* Contact */}
          <Section title={t.contact.title}>
            <p className="text-muted-foreground leading-relaxed mb-2">
              {t.contact.content}
            </p>
            <a
              href={`mailto:privacy@goweki.com`}
              className="text-primary hover:underline font-medium"
            >
              privacy@goweki.com
            </a>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-popover text-popover-foreground rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SubSection({ title, children }) {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}

function List({ items }) {
  return (
    <ul className="space-y-2 ml-4">
      {items.map((item, index) => (
        <li key={index} className="flex items-start">
          <span className="text-primary mr-2 mt-1">•</span>
          <span className="text-muted-foreground leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
