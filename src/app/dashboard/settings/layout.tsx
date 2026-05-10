'use client'

/**
 * Settings is accessible from all roles via /dashboard/settings.
 * No sidebar here — it's rendered inside the parent role layout.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
