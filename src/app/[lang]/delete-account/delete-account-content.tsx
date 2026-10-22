"use client";

import { useI18n } from "@/lib/i18n";
import Footer from "@/components/ui/footer";

const copy = {
  en: {
    eyebrow: "Loci account support",
    title: "Request deletion of your Loci account",
    intro:
      "You can request deletion of your Loci account and the data associated with it, even if you can no longer sign in.",
    steps: "How to request account deletion",
    emailStart: "Email",
    emailSubject: "with the subject",
    subject: "Loci account deletion request.",
    identify:
      "Include the email address or phone number registered to your Loci account so we can identify it. If you signed in with Google, provide the email address linked to that account.",
    verify:
      "We will verify that you own the account, contact you if we need more information, and confirm when the request is complete. Do not send us your password or verification codes.",
    timeframe:
      "We process verified deletion requests within 30 days. You can request deletion by email if you cannot access the app.",
    deleted: "Data deleted",
    deletedIntro:
      "After verifying your request, we delete your Loci account and the following associated data from our active systems:",
    deletedItems: [
      "Your account profile and sign-in details, including your name, email address, phone number, profile image, and authentication tokens.",
      "Business data stored in Loci, including connected WhatsApp configuration and credentials, contacts, conversations and message records, templates, campaigns, assistant settings, products, inventory, orders, and invoices.",
      "Account-related technical data, such as usage records and support information associated with your account.",
    ],
    providerData:
      "Deleting your Loci account disconnects its integrations. It does not delete data held by WhatsApp/Meta, Google, payment providers, or other services you use. Those providers apply their own deletion processes and retention policies.",
    retained: "Data that may be retained",
    retainedInfo:
      "We retain payment, payout, invoice, and transaction records only when needed for accounting, tax, fraud prevention, disputes, or another legal obligation. These records are kept for the period required by that obligation, then deleted or de-identified. They are not used to provide services to a deleted account.",
    backups:
      "Encrypted backups may temporarily contain data already deleted from our active systems. Backups are overwritten within 90 days. If a backup is restored for disaster recovery, deletion requests are reapplied.",
  },
  sw: {
    eyebrow: "Usaidizi wa akaunti ya Loci",
    title: "Omba kufutwa kwa akaunti yako ya Loci",
    intro:
      "Unaweza kuomba kufutwa kwa akaunti yako ya Loci na data inayohusishwa nayo, hata kama huwezi tena kuingia.",
    steps: "Jinsi ya kuomba kufutwa kwa akaunti",
    emailStart: "Tuma barua pepe kwa",
    emailSubject: "yenye mada",
    subject: "Ombi la kufuta akaunti ya Loci.",
    identify:
      "Jumuisha anwani ya barua pepe au nambari ya simu iliyosajiliwa kwenye akaunti yako ya Loci ili tuweze kuitambua. Ikiwa uliingia kwa Google, toa anwani ya barua pepe inayohusishwa na akaunti hiyo.",
    verify:
      "Tutathibitisha kuwa akaunti ni yako, tutawasiliana nawe tukihitaji maelezo zaidi, na tutathibitisha ombi litakapokamilika. Usitutumie nenosiri au misimbo ya uthibitishaji.",
    timeframe:
      "Tunashughulikia maombi yaliyothibitishwa ndani ya siku 30. Unaweza kuomba kufutwa kwa barua pepe ikiwa huwezi kufikia programu.",
    deleted: "Data inayofutwa",
    deletedIntro:
      "Baada ya kuthibitisha ombi lako, tunafuta akaunti yako ya Loci na data ifuatayo inayohusishwa nayo kutoka kwenye mifumo yetu inayotumika:",
    deletedItems: [
      "Wasifu wa akaunti na maelezo ya kuingia, ikiwemo jina, anwani ya barua pepe, nambari ya simu, picha ya wasifu na tokeni za uthibitishaji.",
      "Data ya biashara iliyohifadhiwa Loci, ikiwemo mipangilio na vitambulisho vya WhatsApp vilivyounganishwa, anwani, mazungumzo na rekodi za ujumbe, violezo, kampeni, mipangilio ya msaidizi, bidhaa, hesabu ya bidhaa, oda na ankara.",
      "Data ya kiufundi inayohusishwa na akaunti, kama rekodi za matumizi na taarifa za usaidizi.",
    ],
    providerData:
      "Kufuta akaunti yako ya Loci hutenganisha miunganisho yake. Hakufuti data iliyohifadhiwa na WhatsApp/Meta, Google, watoa huduma wa malipo au huduma nyingine unazotumia. Watoa huduma hao hutumia taratibu na sera zao za uhifadhi wa data.",
    retained: "Data inayoweza kuhifadhiwa",
    retainedInfo:
      "Tunahifadhi rekodi za malipo, malipo ya wauzaji, ankara na miamala tu zinapohitajika kwa uhasibu, kodi, kuzuia udanganyifu, migogoro au wajibu mwingine wa kisheria. Rekodi hizi huhifadhiwa kwa muda unaohitajika na wajibu huo, kisha hufutwa au kutotambulisha mtu. Hazitumiki kutoa huduma kwa akaunti iliyofutwa.",
    backups:
      "Nakala rudufu zilizosimbwa zinaweza kuwa na data iliyofutwa kutoka kwenye mifumo yetu inayotumika kwa muda. Nakala rudufu hubadilishwa ndani ya siku 90. Nakala rudufu ikirejeshwa kwa ajili ya uokoaji wa dharura, maombi ya kufuta hutekelezwa tena.",
  },
} as const;

export default function DeleteAccountContent() {
  const { language } = useI18n();
  const t = copy[language];

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-background to-card px-4 py-12">
        <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t.eyebrow}
          </p>
          <h1 className="text-4xl font-bold md:text-5xl">{t.title}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t.intro}
          </p>
        </header>

        <section
          aria-labelledby="steps-heading"
          className="rounded-xl border bg-card p-6 shadow-sm md:p-8"
        >
          <h2 id="steps-heading" className="text-2xl font-semibold">
            {t.steps}
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6 leading-relaxed text-muted-foreground">
            <li>
              {t.emailStart}{" "}
              <a
                className="font-semibold text-primary underline"
                href={`mailto:privacy@goweki.com?subject=${encodeURIComponent(t.subject)}`}
              >
                privacy@goweki.com
              </a>{" "}
              {t.emailSubject} <strong>“{t.subject}”</strong>
            </li>
            <li>{t.identify}</li>
            <li>{t.verify}</li>
          </ol>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            {t.timeframe}
          </p>
        </section>

        <section
          aria-labelledby="deleted-heading"
          className="rounded-xl border bg-card p-6 shadow-sm md:p-8"
        >
          <h2 id="deleted-heading" className="text-2xl font-semibold">
            {t.deleted}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t.deletedIntro}
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
            {t.deletedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {t.providerData}
          </p>
        </section>

        <section
          aria-labelledby="retained-heading"
          className="rounded-xl border bg-card p-6 shadow-sm md:p-8"
        >
          <h2 id="retained-heading" className="text-2xl font-semibold">
            {t.retained}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t.retainedInfo}
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {t.backups}
          </p>
        </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
