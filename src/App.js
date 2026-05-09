import { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import "./App.css";

const CATEGORIES = ["Food", "Transport", "Education", "Entertainment", "Health", "Shopping", "Other"];

const CAT_COLORS = {
  Food: "#1D9E75",
  Transport: "#378ADD",
  Education: "#7F77DD",
  Entertainment: "#D4537E",
  Health: "#5DCAA5",
  Shopping: "#EF9F27",
  Other: "#888780",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const INITIAL_TRANSACTIONS = [
  { id: 1, type: "income",  amount: 50000, category: "Other",         note: "Salary",       date: "2026-05-01" },
  { id: 2, type: "expense", amount: 8000,  category: "Food",          note: "Groceries",    date: "2026-05-02" },
  { id: 3, type: "expense", amount: 3500,  category: "Transport",     note: "Bus pass",     date: "2026-05-03" },
  { id: 4, type: "expense", amount: 2000,  category: "Education",     note: "Books",        date: "2026-05-04" },
  { id: 5, type: "expense", amount: 1500,  category: "Entertainment", note: "Movie",        date: "2026-05-05" },
  { id: 6, type: "expense", amount: 4200,  category: "Health",        note: "Doctor visit", date: "2026-05-06" },
  { id: 7, type: "expense", amount: 6000,  category: "Shopping",      note: "Clothes",      date: "2026-05-07" },
];

const fmt = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

export default function App() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [activeTab, setActiveTab]       = useState("dashboard");
  const [showForm, setShowForm]         = useState(false);
  const [editId, setEditId]             = useState(null);
  const [budgetLimit, setBudgetLimit]   = useState(20000);
  const [filterType, setFilterType]     = useState("all");
  const [filterCat, setFilterCat]       = useState("all");

  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    type: "expense", amount: "", category: "Food", note: "", date: today,
  });

  const totalIncome  = useMemo(() => transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [transactions]);
  const balance      = totalIncome - totalExpense;

  const pieData = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const barData = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const m = MONTHS[new Date(t.date).getMonth()];
      if (!map[m]) map[m] = { month: m, Income: 0, Expense: 0 };
      if (t.type === "income") map[m].Income += t.amount;
      else map[m].Expense += t.amount;
    });
    return Object.values(map);
  }, [transactions]);

  const filtered = useMemo(() =>
    [...transactions]
      .filter(t => (filterType === "all" || t.type === filterType) && (filterCat === "all" || t.category === filterCat))
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, filterType, filterCat]
  );

  const recentTxs = useMemo(() =>
    [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [transactions]
  );

  function openForm(id = null) {
    setEditId(id);
    if (id !== null) {
      const t = transactions.find(tx => tx.id === id);
      setForm({ type: t.type, amount: String(t.amount), category: t.category, note: t.note, date: t.date });
    } else {
      setForm({ type: "expense", amount: "", category: "Food", note: "", date: today });
    }
    setShowForm(true);
    setActiveTab("transactions");
  }

  function closeForm() { setShowForm(false); setEditId(null); }

  function saveEntry() {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0 || !form.date) return;
    const entry = { ...form, id: editId !== null ? editId : Date.now(), amount: amt };
    if (editId !== null) setTransactions(ts => ts.map(t => t.id === editId ? entry : t));
    else setTransactions(ts => [...ts, entry]);
    closeForm();
  }

  function deleteEntry(id) {
    setTransactions(ts => ts.filter(t => t.id !== id));
  }

  const budgetUsed = Math.min((totalExpense / budgetLimit) * 100, 100);
  const overBudget = totalExpense > budgetLimit;

  const catBreakdown = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  return (
    <div className="app">
      <div className="container">

        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
            </div>
            <div>
              <h1 className="app-title">Expense Manager</h1>
              <p className="app-subtitle">May 2026</p>
            </div>
          </div>
          <button className="btn-primary" onClick={() => openForm()}>
            <span>+</span> Add Entry
          </button>
        </header>

        {/* Tabs */}
        <nav className="tabs">
          {["dashboard", "transactions", "budget"].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="tab-content">
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label income-label">↑ Total Income</div>
                <div className="metric-value income-value">{fmt(totalIncome)}</div>
                <div className="metric-sub">{transactions.filter(t => t.type === "income").length} entries</div>
              </div>
              <div className="metric-card">
                <div className="metric-label expense-label">↓ Total Expenses</div>
                <div className="metric-value expense-value">{fmt(totalExpense)}</div>
                <div className="metric-sub">{transactions.filter(t => t.type === "expense").length} entries</div>
              </div>
              <div className="metric-card">
                <div className="metric-label balance-label">⇌ Balance</div>
                <div className={`metric-value ${balance >= 0 ? "balance-positive" : "balance-negative"}`}>{fmt(balance)}</div>
                <div className="metric-sub">
                  {totalIncome > 0 ? `Savings rate: ${Math.round((balance / totalIncome) * 100)}%` : "—"}
                </div>
              </div>
            </div>

            <div className="charts-grid">
              <div className="card">
                <h2 className="card-title">Spending by category</h2>
                <div className="legend">
                  {pieData.map(d => (
                    <span key={d.name} className="legend-item">
                      <span className="legend-dot" style={{ background: CAT_COLORS[d.name] || "#888" }} />
                      {d.name}
                    </span>
                  ))}
                </div>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                        {pieData.map(entry => (
                          <Cell key={entry.name} fill={CAT_COLORS[entry.name] || "#888"} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="empty-msg">No expense data yet</p>
                )}
              </div>

              <div className="card">
                <h2 className="card-title">Monthly overview</h2>
                <div className="legend">
                  <span className="legend-item"><span className="legend-dot" style={{ background: "#1D9E75" }} />Income</span>
                  <span className="legend-item"><span className="legend-dot" style={{ background: "#D85A30" }} />Expense</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} barSize={16}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} tickFormatter={v => "₹" + (v >= 1000 ? (v / 1000) + "k" : v)} />
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Bar dataKey="Income" fill="#1D9E75" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expense" fill="#D85A30" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="card-title">Recent transactions</h2>
              {recentTxs.map((t, i) => (
                <div key={t.id} className={`tx-row ${i < recentTxs.length - 1 ? "bordered" : ""}`}>
                  <div className={`tx-icon ${t.type === "income" ? "tx-icon-income" : "tx-icon-expense"}`}>
                    {t.type === "income" ? "↑" : "↓"}
                  </div>
                  <div className="tx-info">
                    <div className="tx-note">{t.note || "—"}</div>
                    <div className="tx-meta">{t.category} · {t.date}</div>
                  </div>
                  <span className={`tx-amount ${t.type === "income" ? "income-value" : "expense-value"}`}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="tab-content">
            {showForm && (
              <div className="card form-card">
                <h2 className="card-title">{editId !== null ? "Edit transaction" : "Add transaction"}</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (₹)</label>
                    <input type="number" className="form-input" placeholder="0" min="0"
                      value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-input" value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Note</label>
                    <input type="text" className="form-input" placeholder="Description..."
                      value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn-primary" onClick={saveEntry}>
                    {editId !== null ? "Update" : "Save"}
                  </button>
                  <button className="btn-ghost" onClick={closeForm}>Cancel</button>
                </div>
              </div>
            )}

            <div className="filter-bar">
              <select className="form-input filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select className="form-input filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="all">All categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <span className="entry-count">{filtered.length} entr{filtered.length === 1 ? "y" : "ies"}</span>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {filtered.length === 0 ? (
                <p className="empty-msg" style={{ padding: "2.5rem" }}>No transactions found</p>
              ) : filtered.map((t, i) => (
                <div key={t.id} className={`tx-row padded ${i < filtered.length - 1 ? "bordered" : ""}`}>
                  <span className="cat-dot" style={{ background: CAT_COLORS[t.category] || "#888" }} />
                  <div className="tx-info">
                    <div className="tx-note">{t.note || "—"}</div>
                    <div className="tx-meta">{t.category} · {t.date}</div>
                  </div>
                  <span className={`type-pill ${t.type === "income" ? "pill-income" : "pill-expense"}`}>{t.type}</span>
                  <span className={`tx-amount ${t.type === "income" ? "income-value" : "expense-value"}`}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </span>
                  <div className="tx-actions">
                    <button className="icon-btn" onClick={() => openForm(t.id)} aria-label="Edit">✎</button>
                    <button className="icon-btn danger" onClick={() => deleteEntry(t.id)} aria-label="Delete">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BUDGET */}
        {activeTab === "budget" && (
          <div className="tab-content">
            <div className="card" style={{ marginBottom: 14 }}>
              <h2 className="card-title">Monthly budget limit</h2>
              <div className="budget-input-row">
                <span className="budget-symbol">₹</span>
                <input type="number" className="form-input" style={{ width: 150 }}
                  value={budgetLimit} onChange={e => setBudgetLimit(Number(e.target.value))} />
                <span className="budget-per">per month</span>
              </div>
              <div className="budget-labels">
                <span>Spent: <strong style={{ color: overBudget ? "#993C1D" : "#1a1a1a" }}>{fmt(totalExpense)}</strong></span>
                <span style={{ color: overBudget ? "#993C1D" : "#0F6E56", fontWeight: 500 }}>
                  {Math.round(budgetUsed)}% used
                </span>
              </div>
              <div className="bar-track" style={{ marginBottom: 12 }}>
                <div className="bar-fill" style={{ width: budgetUsed + "%", background: overBudget ? "#D85A30" : "#1D9E75" }} />
              </div>
              {overBudget ? (
                <div className="alert alert-danger">⚠ Over budget by {fmt(totalExpense - budgetLimit)}</div>
              ) : (
                <div className="alert alert-success">✓ {fmt(budgetLimit - totalExpense)} remaining this month</div>
              )}
            </div>

            <div className="card">
              <h2 className="card-title">Breakdown by category</h2>
              {catBreakdown.length === 0 && <p className="empty-msg">No expenses yet</p>}
              {catBreakdown.map(([cat, val]) => {
                const pct = totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0;
                return (
                  <div key={cat} className="cat-row">
                    <div className="cat-row-header">
                      <span className="cat-name">
                        <span className="cat-dot" style={{ background: CAT_COLORS[cat] || "#888" }} />
                        {cat}
                      </span>
                      <span className="cat-value">{fmt(val)} <span className="cat-pct">({pct}%)</span></span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: pct + "%", background: CAT_COLORS[cat] || "#888" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
