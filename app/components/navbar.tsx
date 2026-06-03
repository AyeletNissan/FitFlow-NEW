import Link from "next/link";
import { auth } from "@/auth";
import { signIn, signOut } from "@/auth";
import ThemeToggle from "./theme-toggle";
import UserAvatar from "./user-avatar";
import MobileHamburger from "./mobile-hamburger";

export default async function Navbar() {
  const session = await auth();

  return (
    <nav style={{ borderBottom: "2px solid var(--theme-border-light)", backgroundColor: "var(--theme-bg-card)", backdropFilter: "blur(4px)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="text-lg sm:text-xl font-bold" style={{ background: `linear-gradient(to right, var(--theme-primary), var(--theme-primary-hover))`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
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
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              {/* On mobile we want hamburger before theme toggle; swap using order classes */}
              <div className="order-1 md:order-2">
                <MobileHamburger />
              </div>
              <div className="order-2 md:order-1">
                <ThemeToggle />
              </div>
              {/* Mobile hamburger placed here so toggle + avatar + hamburger fit one row */}
            </div>
            {session ? (
              <div className="flex items-center gap-4">
                <UserAvatar
                  imageUrl={session.user?.image}
                  userName={session.user?.name}
                />
                <span className="hidden sm:inline-block text-sm font-medium" style={{ color: "var(--theme-text)" }}>
                  {session.user?.name}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await signOut();
                  }}
                >
                  {/* Mobile: compact icon-only button. Desktop: full text stays visible. */}
                  <button
                    type="submit"
                    aria-label="Sign Out"
                    title="Sign Out"
                    className="rounded-xl border-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium transition-all flex items-center justify-center"
                    style={{
                      borderColor: "var(--theme-border-light)",
                      color: "var(--theme-primary)",
                      backgroundColor: "var(--theme-bg-card)",
                    }}
                  >
                    <span className="md:hidden">↪</span>
                    <span className="hidden md:inline">Sign Out</span>
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
                  className="rounded-xl w-full sm:w-auto px-3 py-2 sm:px-5 sm:py-2.5 text-sm font-semibold text-white transition-all hover:[background-color:var(--theme-primary-hover)] hover:shadow-lg"
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
