import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/revenue")({
  component: RevenuePage,
});

// ─── Demo Data ───────────────────────────────────────────────────────────────

const REVENUE_SOURCES = [
  { name: "YouTube", icon: "▶️", amount: 42000, connected: true, color: "red" },
  { name: "Twitch", icon: "🟣", amount: 28000, connected: true, color: "purple" },
  { name: "TikTok", icon: "🎵", amount: 0, connected: false, color: "pink" },
  { name: "Kick", icon: "⚡", amount: 0, connected: false, color: "green" },
  { name: "Patreon", icon: "🤝", amount: 0, connected: false, color: "orange" },
  { name: "Ko-fi", icon: "☕", amount: 0, connected: false, color: "blue" },
  { name: "Merch", icon: "👕", amount: 0, connected: false, color: "indigo" },
  { name: "PayPal", icon: "💸", amount: 0, connected: false, color: "blue" },
  { name: "Affiliate", icon: "🔗", amount: 0, connected: false, color: "teal" },
];

const MONTHLY_REVENUE = [
  { month: "Jan", income: 3200, expenses: 800 },
  { month: "Feb", income: 3800, expenses: 900 },
  { month: "Mar", income: 4100, expenses: 750 },
  { month: "Apr", income: 3900, expenses: 1100 },
  { month: "May", income: 4500, expenses: 950 },
  { month: "Jun", income: 5200, expenses: 1200 },
];

const PROJECTIONS = {
  nextMonth: 5800,
  nextQuarter: 17500,
  nextYear: 72000,
};

const TAXES = {
  estimatedOwed: 8400,
  rate: 22,
  paidYtd: 3200,
  remaining: 5200,
};

const EXPENSES = [
  { category: "Equipment", amount: 3500, monthly: true },
  { category: "Software", amount: 1200, monthly: true },
  { category: "Art/Design", amount: 800, monthly: false },
  { category: "Marketing", amount: 600, monthly: true },
  { category: "Internet/Hosting", amount: 400, monthly: true },
];

// ─── Revenue Page Component ──────────────────────────────────────────────────

function RevenuePage() {
  const totalIncome = MONTHLY_REVENUE.reduce((s, m) => s + m.income, 0);
  const totalExpenses = MONTHLY_REVENUE.reduce((s, m) => s + m.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;
  const ytdRevenue = MONTHLY_REVENUE.slice(0, new Date().getMonth() + 1).reduce((s, m) => s + m.income, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💰 Revenue</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track your earnings across all platforms and sponsorships.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="YTD Revenue" value={`$${ytdRevenue.toLocaleString()}`} change="+15.2%" up />
        <StatCard label="Total Income" value={`$${totalIncome.toLocaleString()}`} change="From all sources" up />
        <StatCard label="Total Expenses" value={`$${totalExpenses.toLocaleString()}`} change={`${((totalExpenses / totalIncome) * 100).toFixed(0)}% of income`} up={false} />
        <StatCard label="Profit" value={`$${totalProfit.toLocaleString()}`} change={`${((totalProfit / totalIncome) * 100).toFixed(0)}% margin`} up />
      </div>

      {/* ── Connected Platform Revenue ────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connected Platforms</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {REVENUE_SOURCES.map((source) => (
            <div key={source.name} className={`widget-card ${source.connected ? "" : "opacity-60"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{source.icon}</span>
                {source.connected ? (
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{source.name}</p>
              {source.connected ? (
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">${(source.amount / 100).toFixed(2)}</p>
              ) : (
                <button className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  + Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Monthly Revenue Chart ─────────────────────────────── */}
      <div className="widget-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="widget-header">📊 Monthly Revenue</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Income vs Expenses (YTD)</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-gray-500 dark:text-gray-400">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="text-gray-500 dark:text-gray-400">Expenses</span>
            </div>
          </div>
        </div>
        <div className="flex items-end gap-3 h-40">
          {MONTHLY_REVENUE.map((m) => {
            const maxVal = Math.max(...MONTHLY_REVENUE.map((x) => x.income));
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: `${(m.income / maxVal) * 100}%` }}>
                  <div className="w-full bg-indigo-500 rounded-t-sm transition-all" style={{ height: `${(m.income / (m.income + m.expenses)) * 100}%` }} />
                  <div className="w-full bg-rose-400 rounded-t-sm transition-all" style={{ height: `${(m.expenses / m.income) * 50}%` }} />
                </div>
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-1">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Projected Income + Taxes ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projected Income */}
        <div className="widget-card">
          <h3 className="widget-header">📈 Projected Income</h3>
          <div className="space-y-4 mt-4">
            <ProjectionRow label="Next Month" value={`$${PROJECTIONS.nextMonth.toLocaleString()}`} change="+11.5%" up />
            <ProjectionRow label="Next Quarter" value={`$${PROJECTIONS.nextQuarter.toLocaleString()}`} change="Based on current trend" up />
            <ProjectionRow label="Next Year" value={`$${PROJECTIONS.nextYear.toLocaleString()}`} change="Conservative estimate" up />
          </div>
        </div>

        {/* Taxes */}
        <div className="widget-card">
          <h3 className="widget-header">🧾 Taxes</h3>
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Est. Tax Rate</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{TAXES.rate}%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Owed</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">${TAXES.estimatedOwed.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Paid YTD</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">${TAXES.paidYtd.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Remaining</span>
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">${TAXES.remaining.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-amber-500" style={{ width: `${(TAXES.paidYtd / TAXES.estimatedOwed) * 100}%` }} />
            </div>
            <p className="text-xs text-gray-400 text-center">{((TAXES.paidYtd / TAXES.estimatedOwed) * 100).toFixed(0)}% paid toward estimated taxes</p>
          </div>
        </div>
      </div>

      {/* ── Expenses ──────────────────────────────────────────── */}
      <div className="widget-card">
        <h3 className="widget-header">📋 Expenses</h3>
        <div className="space-y-3 mt-4">
          {EXPENSES.map((exp) => (
            <div key={exp.category} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{exp.category}</span>
                {exp.monthly && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium">Monthly</span>}
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">${exp.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border border-rose-100 dark:border-rose-900/50">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Total Monthly Expenses</span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
              ${EXPENSES.filter((e) => e.monthly).reduce((s, e) => s + e.amount, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Profit Summary ────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">Total Profit (YTD)</p>
            <p className="text-3xl font-bold mt-1">${totalProfit.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium opacity-80">Profit Margin</p>
            <p className="text-2xl font-bold mt-1">{((totalProfit / totalIncome) * 100).toFixed(0)}%</p>
          </div>
        </div>
        <div className="mt-4 w-full bg-white/20 rounded-full h-2 overflow-hidden">
          <div className="h-full rounded-full bg-white" style={{ width: `${(totalProfit / totalIncome) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, up }: { label: string; value: string; change: string; up?: boolean }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value mt-1">{value}</p>
      <p className={`text-xs font-medium mt-1 ${up !== false ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
        {change}
      </p>
    </div>
  );
}

function ProjectionRow({ label, value, change, up }: { label: string; value: string; change: string; up?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <p className={`text-xs font-medium ${up ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
        {change}
      </p>
    </div>
  );
}