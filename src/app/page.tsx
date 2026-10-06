import { redirect } from "next/navigation";
import { DASHBOARD_PATH } from "@/lib/constants";

export default function Home() {
  redirect(DASHBOARD_PATH);
}
