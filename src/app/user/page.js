import UserSummary from "@/components/elements/user/userSummary";
import UserAnalytics from "@/components/elements/user/userAnalytics";
import BreadCrumb from "@/components/mols/Breadcrumb";

export default function UserPage() {
  //render
  return (
    <main className="w-full flex-col md:min-h-[512px] pt-20 pb-6 px-2 sm:px-6 md:px-12 max-w-screen-xl mx-auto">
      <UserSummary />
      <UserAnalytics />
    </main>
  );
}
