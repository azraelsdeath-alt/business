import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/community")({
  component: () => (
    <PageShell title="👥 Community" description="Engage with your audience and manage community interactions.">
      <div className="p-8 rounded-2xl bg-gray-50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-700 text-center text-gray-400 dark:text-gray-500 text-sm">
        Community hub &mdash; coming soon
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