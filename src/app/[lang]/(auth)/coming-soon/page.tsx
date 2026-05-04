import ComingSoon from "@/components/landing-page/coming-soon";

export default function ComingSoonPage() {
  const launchDateString = process.env.LAUNCH_DATE ?? "2026-05-01";

  return <ComingSoon launchDateString={launchDateString} />;
}
