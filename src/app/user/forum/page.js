import BreadCrumb from "@/components/mols/Breadcrumb";

export default function UserForumPage() {
  //render
  return (
    <main className="w-full flex-col pt-20 pb-6 px-2 sm:px-6 md:px-12 max-w-screen-xl mx-auto">
      <BreadCrumb pageName="Forum" />
      <div>
        <h3>Internal discussions forum</h3>
        <span className="block text-center italic">
          Still stitching up things here, check back in later...
        </span>
      </div>
    </main>
  );
}
