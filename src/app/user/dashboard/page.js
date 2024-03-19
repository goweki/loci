import BreadCrumb from "@/components/mols/Breadcrumb";

export default function UserDashboardPage() {
  //render
  return (
    <main className="w-full flex-col md:min-h-[512px] pt-20 pb-6 px-2 sm:px-6 md:px-12 max-w-screen-xl mx-auto">
      <BreadCrumb pageName="Dashboard" />
      <div>
        <h3>Devices and monitoring Data</h3>
        <span className="block text-center italic">
          Still stitching up things here, check back in later...
        </span>
      </div>
    </main>
  );
}
