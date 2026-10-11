import { redirect } from "next/navigation";

// There is no dashboard: nothing links to /admin and proxy.ts already sends
// signed-in admins to Analytics, so a direct visit goes there too.
export default function AdminPage() {
  redirect("/admin/amounts");
}
