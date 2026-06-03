import { redirect } from "next/navigation";
import { auth } from "@/auth";
import RunCoachClient from "./run-coach-client";

export default async function RunCoach() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return <RunCoachClient />;
}
