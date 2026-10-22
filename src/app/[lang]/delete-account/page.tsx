import type { Metadata } from "next";
import DeleteAccountContent from "./delete-account-content";

export const metadata: Metadata = {
  title: "Delete your Loci account",
  description:
    "How to request deletion of your Loci account and associated data.",
  robots: { index: true, follow: true },
};

export default function DeleteAccountPage() {
  return <DeleteAccountContent />;
}
