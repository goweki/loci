import { ContactForm } from "@/components/forms/contact-us";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-slate-600">
            Have a question or want to work together? We&apos;d love to hear
            from you.
          </p>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
