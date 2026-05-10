'use client'

/**
 * Root dashboard layout — thin wrapper that just provides SessionProvider context.
 * Each role sub-folder (admin / doctor / user) has its own full layout with sidebar.
 */
export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
