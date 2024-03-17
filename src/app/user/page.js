import UserSummary from "@/components/elements/user/homeSummary";

export default function UserPage() {
  //render
  return (
    <main className="w-full flex-col flex-grow pt-20 pb-6 px-2 sm:px-6 md:px-12 max-w-screen-xl mx-auto">
      <UserSummary />
    </main>
  );
}
