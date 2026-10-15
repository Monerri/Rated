import type { Metadata } from "next";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-10 sm:px-6">
      <h1 className="text-[32px] font-extrabold leading-tight">Specialists and accounts</h1>
      <AdminConsole />
    </div>
  );
}
