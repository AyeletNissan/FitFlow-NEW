import Link from "next/link";
import { auth } from "@/auth";
import { signIn, signOut } from "@/auth";
import ThemeToggle from "./theme-toggle";
import UserAvatar from "./user-avatar";

export default async function Navbar() {
  const session = await auth();

  return (
    <nav style={{ borderBottom: "2px solid var(--theme-border-light)", backgroundColor: "var(--theme-bg-card)", backdropFilter: "blur(4px)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-xl font-bold" style={{ background: `linear-gradient(to right, var(--theme-primary), var(--theme-primary-hover))`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              FitFlow
            </Link>
            {session && (
              <div className="hidden md:flex md:gap-8">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium transition-colors hover:[color:var(--theme-primary)]"
                  style={{ color: "var(--theme-text-muted)" }}
                >
                  Dashboard
                </Link>
                <Link
                  href="/run-coach"
                  className="text-sm font-medium transition-colors hover:[color:var(--theme-primary)]"
                  style={{ color: "var(--theme-text-muted)" }}
                >
                  Run Coach
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {session ? (
              <div className="flex items-center gap-4">
                <UserAvatar
                  imageUrl={session.user?.image}
                  userName={session.user?.name}
                />
                <span className="text-sm font-medium" style={{ color: "var(--theme-text)" }}>
                  {session.user?.name}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await signOut();
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all hover:[background-color:var(--theme-bg-hover)]"
                    style={{
                      borderColor: "var(--theme-border-light)",
                      color: "var(--theme-primary)",
                      backgroundColor: "var(--theme-bg-card)",
                    }}
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("google");
                }}
              >
                <button
                  type="submit"
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:[background-color:var(--theme-primary-hover)] hover:shadow-lg"
                  style={{
                    backgroundColor: "var(--theme-primary)",
                    boxShadow: "0 4px 6px -1px var(--theme-shadow-strong)",
                  }}
                >
                  Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
