import { redirect } from "next/navigation";

export default function LegacyStadiumsPage() {
  redirect("/manager/stadiums");
}
