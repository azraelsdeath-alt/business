import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  component: () => (
    <PageShell title="⚙️ Settings" description="Manage your account, preferences, and connected platforms.">
      <div className="max-w-2xl space-y-4">
        <div className="stat-card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Profile</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your profile information and preferences.</p>
        </div>
        <div className="stat-card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Connected Platforms</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Link your YouTube, TikTok, Twitch, and other accounts.</p>
        </div>
        <div className="stat-card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure email and in-app notification preferences.</p>
        </div>
        <div className="stat-card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Billing</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your subscription and payment methods.</p>
        </div>
      </div>
    </PageShell>
  ),
});

function PageShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
}