/*
Please run : npm install recharts lucide-react clsx
*/

"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Trash2,
  Edit2,
  PlusCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Moon,
  Sun
} from "lucide-react";

// --- Types ---
type TransactionType = "income" | "expense";
type ViewMode = "daily" | "monthly";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  category: string;
}

// --- Utility: Currency Formatter ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// --- Main Component ---
export default function ExpenseTracker() {
  // --- State ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(false);
  
  // View Control
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Form State
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("General");
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Effects ---
  useEffect(() => {
    setIsMounted(true);
    // Load Data
    const savedData = localStorage.getItem("expense-tracker-data");
    if (savedData) setTransactions(JSON.parse(savedData));

    // Load Theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setDarkMode(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("expense-tracker-data", JSON.stringify(transactions));
    }
  }, [transactions, isMounted]);

  // --- Handlers ---
  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    // Removed window.location.reload() to allow React to switch views dynamically
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) return;

    const payload: Transaction = {
      id: editingId ? editingId : crypto.randomUUID(),
      description,
      amount: parseFloat(amount),
      type,
      date,
      category,
    };

    if (editingId) {
      setTransactions((prev) => prev.map((t) => (t.id === editingId ? payload : t)));
      setEditingId(null);
    } else {
      setTransactions((prev) => [...prev, payload]);
    }

    setDescription("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory("General");
    setType("expense");
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setDescription(t.description);
    setAmount(t.amount.toString());
    setType(t.type);
    setDate(t.date);
    setCategory(t.category);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this record?")) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDescription("");
    setAmount("");
    setCategory("General");
  };

  const navigateTime = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "daily") {
      newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
      setSelectedDay(null);
    } else {
      newDate.setFullYear(currentDate.getFullYear() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const handleDayClick = (day: number) => {
    if (selectedDay === day) setSelectedDay(null);
    else setSelectedDay(day);
  };

  // --- Calculations ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      const isSameYear = tDate.getFullYear() === currentDate.getFullYear();
      const isSameMonth = tDate.getMonth() === currentDate.getMonth();
      return viewMode === "daily" ? (isSameYear && isSameMonth) : isSameYear;
    });
  }, [transactions, currentDate, viewMode]);

  const displayList = useMemo(() => {
    if (viewMode === "daily" && selectedDay !== null) {
      return filteredTransactions.filter((t) => new Date(t.date).getDate() === selectedDay);
    }
    return filteredTransactions;
  }, [filteredTransactions, selectedDay, viewMode]);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const monthlyChartData = useMemo(() => {
    if (viewMode === "daily") return [];
    const dataMap: Record<number, { name: string; income: number; expense: number }> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    months.forEach((m, index) => { dataMap[index] = { name: m, income: 0, expense: 0 }; });
    filteredTransactions.forEach((t) => {
      const monthIndex = new Date(t.date).getMonth();
      if (dataMap[monthIndex]) {
        if (t.type === "income") dataMap[monthIndex].income += t.amount;
        else dataMap[monthIndex].expense += t.amount;
      }
    });
    return Object.values(dataMap);
  }, [filteredTransactions, viewMode]);

  const calendarData = useMemo(() => {
    if (viewMode === "monthly") return null;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push({ day: null, income: 0, expense: 0 });
    for (let i = 1; i <= daysInMonth; i++) {
      const dayTransactions = filteredTransactions.filter(t => new Date(t.date).getDate() === i);
      const dayIncome = dayTransactions.filter(t => t.type === "income").reduce((acc, c) => acc + c.amount, 0);
      const dayExpense = dayTransactions.filter(t => t.type === "expense").reduce((acc, c) => acc + c.amount, 0);
      days.push({ day: i, income: dayIncome, expense: dayExpense });
    }
    return days;
  }, [filteredTransactions, currentDate, viewMode]);

  const timeLabel = viewMode === "daily" 
    ? currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }) 
    : currentDate.getFullYear().toString();

  if (!isMounted) return null;

  // ------------------------------------------------------------------
  //  SOLUTION: Conditional Return (Split Views)
  // ------------------------------------------------------------------

  // --- DARK MODE RETURN ---
  if (darkMode) {
    return (
      <div className="dark">
        <div className="min-h-screen bg-gray-950 p-4 md:p-8 font-sans text-gray-100 transition-colors duration-300">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center gap-4">
              <h1 className="text-3xl font-bold text-indigo-400 flex items-center gap-2">
                <Wallet className="w-8 h-8" /> Expense Recorder
              </h1>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-900 p-2 rounded-xl shadow-sm border border-gray-800">
                {/* Theme Toggle */}
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <Sun className="w-4 h-4" />
                </button>

                {/* View Toggle */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => { setViewMode("daily"); setSelectedDay(null); }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${
                      viewMode === "daily" 
                        ? "bg-gray-700 text-indigo-300 shadow-sm" 
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <CalendarIcon className="w-4 h-4" /> Calendar
                  </button>
                  <button
                    onClick={() => { setViewMode("monthly"); setSelectedDay(null); }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${
                      viewMode === "monthly" 
                        ? "bg-gray-700 text-indigo-300 shadow-sm" 
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" /> Yearly
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2 border-l border-gray-700 pl-3">
                  <button onClick={() => navigateTime("prev")} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-400" />
                  </button>
                  <span className="min-w-[140px] text-center font-bold text-gray-200 select-none">{timeLabel}</span>
                  <button onClick={() => navigateTime("next")} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Balance" amount={stats.balance} icon={<Wallet className="text-white w-6 h-6" />} color="bg-indigo-500" />
              <StatCard title="Income" amount={stats.income} icon={<TrendingUp className="text-white w-6 h-6" />} color="bg-emerald-500" />
              <StatCard title="Expense" amount={stats.expense} icon={<TrendingDown className="text-white w-6 h-6" />} color="bg-rose-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left: Input */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-800 transition-colors">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-100">
                    {editingId ? <Edit2 className="w-5 h-5 text-orange-500"/> : <PlusCircle className="w-5 h-5 text-indigo-400"/>}
                    {editingId ? "Edit" : "New"} Transaction
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
                      <input
                        type="text"
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Amount</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date</label>
                        <input
                          type="date"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white transition-colors"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Type</label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as TransactionType)}
                          className="w-full p-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-800 text-white transition-colors"
                        >
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full p-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-800 text-white transition-colors"
                        >
                          <option>General</option>
                          <option>Food</option>
                          <option>Transport</option>
                          <option>Utilities</option>
                          <option>Entertainment</option>
                          <option>Salary</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="submit" className={`flex-1 py-2 rounded-lg text-white font-medium ${editingId ? "bg-orange-500" : "bg-indigo-700 hover:bg-indigo-600"}`}>
                        {editingId ? "Update" : "Add"}
                      </button>
                      {editingId && <button type="button" onClick={cancelEdit} className="px-4 bg-gray-700 text-gray-200 rounded-lg">Cancel</button>}
                    </div>
                  </form>
                </div>

                {/* Transaction List */}
                <div className="bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-800 flex flex-col h-[400px] transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-100">
                      History
                      {selectedDay && (
                        <span className="text-sm font-normal bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full">
                          {currentDate.toLocaleString('default', { month: 'short' })} {selectedDay}
                        </span>
                      )}
                    </h2>
                    {selectedDay && (
                      <button 
                        onClick={() => setSelectedDay(null)}
                        className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                      >
                        <FilterX size={14} /> Clear Filter
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {displayList.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-600">
                        <p>{selectedDay ? `No records on Day ${selectedDay}` : 'No records for this period.'}</p>
                      </div>
                    ) : (
                      [...displayList].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t) => (
                        <div key={t.id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 group border border-gray-800 transition-colors">
                          <div className="flex gap-3 items-center">
                            <div className={`w-2 h-8 rounded-full ${t.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            <div>
                              <p className="font-medium text-gray-200">{t.description}</p>
                              <p className="text-xs text-gray-400">{t.date}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                              <button onClick={() => handleEdit(t)}><Edit2 className="w-3 h-3 text-gray-400 hover:text-indigo-500"/></button>
                              <button onClick={() => handleDelete(t.id)}><Trash2 className="w-3 h-3 text-gray-400 hover:text-rose-500"/></button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Visualization */}
              <div className="lg:col-span-2">
                <div className="bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-800 h-full min-h-[500px] transition-colors">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-100">{viewMode === 'daily' ? 'Monthly Calendar' : 'Yearly Overview'}</h2>
                  </div>

                  {viewMode === "daily" ? (
                    /* --- CALENDAR VIEW --- */
                    <div className="h-full">
                      <div className="grid grid-cols-7 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase">{day}</div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-7 grid-rows-5 gap-2 h-[500px]">
                        {calendarData?.map((cell, index) => {
                          if (!cell.day) return <div key={`empty-${index}`} className="bg-transparent" />;
                          
                          const isToday = 
                            new Date().getDate() === cell.day && 
                            new Date().getMonth() === currentDate.getMonth() && 
                            new Date().getFullYear() === currentDate.getFullYear();
                          
                          const isSelected = selectedDay === cell.day;

                          return (
                            <button 
                              key={`day-${cell.day}`} 
                              onClick={() => cell.day && handleDayClick(cell.day)}
                              className={`
                                border rounded-xl p-2 relative flex flex-col justify-between transition-all text-left
                                ${isSelected 
                                    ? 'border-indigo-500 ring-2 ring-indigo-900 bg-indigo-900/20 z-10' 
                                    : 'border-gray-800 hover:border-gray-600 bg-gray-900'
                                }
                              `}
                            >
                              <span className={`text-sm font-semibold ${isToday ? 'text-indigo-400' : 'text-gray-400'}`}>
                                {cell.day}
                              </span>
                              
                              <div className="space-y-1 w-full">
                                {cell.income > 0 && (
                                  <div className="text-[10px] bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded-md font-medium truncate">
                                    +{formatCurrency(cell.income)}
                                  </div>
                                )}
                                {cell.expense > 0 && (
                                  <div className="text-[10px] bg-rose-900/30 text-rose-400 px-1.5 py-0.5 rounded-md font-medium truncate">
                                    -{formatCurrency(cell.expense)}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* --- YEARLY BAR CHART --- */
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                        <Tooltip 
                          contentStyle={{
                              borderRadius: '8px', 
                              border: 'none', 
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              backgroundColor: '#1f2937',
                              color: '#fff'
                          }}
                          formatter={(value: any) => formatCurrency(value)}
                        />
                        <Legend />
                        <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="#f43f5e" name="Expense" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LIGHT MODE RETURN ---
  return (
    <div className="">
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-indigo-700 flex items-center gap-2">
              <Wallet className="w-8 h-8" /> Expense Recorder
            </h1>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Moon className="w-4 h-4" />
              </button>

              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => { setViewMode("daily"); setSelectedDay(null); }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${
                    viewMode === "daily" 
                      ? "bg-white text-indigo-700 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" /> Calendar
                </button>
                <button
                  onClick={() => { setViewMode("monthly"); setSelectedDay(null); }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${
                    viewMode === "monthly" 
                      ? "bg-white text-indigo-700 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" /> Yearly
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                <button onClick={() => navigateTime("prev")} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="min-w-[140px] text-center font-bold text-gray-800 select-none">{timeLabel}</span>
                <button onClick={() => navigateTime("next")} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Balance" amount={stats.balance} icon={<Wallet className="text-white w-6 h-6" />} color="bg-indigo-500" />
            <StatCard title="Income" amount={stats.income} icon={<TrendingUp className="text-white w-6 h-6" />} color="bg-emerald-500" />
            <StatCard title="Expense" amount={stats.expense} icon={<TrendingDown className="text-white w-6 h-6" />} color="bg-rose-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Input */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-colors">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
                  {editingId ? <Edit2 className="w-5 h-5 text-orange-500"/> : <PlusCircle className="w-5 h-5 text-indigo-500"/>}
                  {editingId ? "Edit" : "New"} Transaction
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                    <input
                      type="text"
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as TransactionType)}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white transition-colors"
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white transition-colors"
                      >
                        <option>General</option>
                        <option>Food</option>
                        <option>Transport</option>
                        <option>Utilities</option>
                        <option>Entertainment</option>
                        <option>Salary</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className={`flex-1 py-2 rounded-lg text-white font-medium ${editingId ? "bg-orange-500" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                      {editingId ? "Update" : "Add"}
                    </button>
                    {editingId && <button type="button" onClick={cancelEdit} className="px-4 bg-gray-200 text-gray-800 rounded-lg">Cancel</button>}
                  </div>
                </form>
              </div>

              {/* Transaction List */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px] transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
                    History
                    {selectedDay && (
                      <span className="text-sm font-normal bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {currentDate.toLocaleString('default', { month: 'short' })} {selectedDay}
                      </span>
                    )}
                  </h2>
                  {selectedDay && (
                    <button 
                      onClick={() => setSelectedDay(null)}
                      className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
                    >
                      <FilterX size={14} /> Clear Filter
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                  {displayList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <p>{selectedDay ? `No records on Day ${selectedDay}` : 'No records for this period.'}</p>
                    </div>
                  ) : (
                    [...displayList].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t) => (
                      <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 group border border-transparent transition-colors">
                        <div className="flex gap-3 items-center">
                          <div className={`w-2 h-8 rounded-full ${t.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                          <div>
                            <p className="font-medium text-gray-800">{t.description}</p>
                            <p className="text-xs text-gray-500">{t.date}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                            <button onClick={() => handleEdit(t)}><Edit2 className="w-3 h-3 text-gray-400 hover:text-indigo-500"/></button>
                            <button onClick={() => handleDelete(t.id)}><Trash2 className="w-3 h-3 text-gray-400 hover:text-rose-500"/></button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: Visualization */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full min-h-[500px] transition-colors">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">{viewMode === 'daily' ? 'Monthly Calendar' : 'Yearly Overview'}</h2>
                </div>

                {viewMode === "daily" ? (
                  /* --- CALENDAR VIEW --- */
                  <div className="h-full">
                    <div className="grid grid-cols-7 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase">{day}</div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 grid-rows-5 gap-2 h-[500px]">
                      {calendarData?.map((cell, index) => {
                        if (!cell.day) return <div key={`empty-${index}`} className="bg-transparent" />;
                        
                        const isToday = 
                          new Date().getDate() === cell.day && 
                          new Date().getMonth() === currentDate.getMonth() && 
                          new Date().getFullYear() === currentDate.getFullYear();
                        
                        const isSelected = selectedDay === cell.day;

                        return (
                          <button 
                            key={`day-${cell.day}`} 
                            onClick={() => cell.day && handleDayClick(cell.day)}
                            className={`
                              border rounded-xl p-2 relative flex flex-col justify-between transition-all text-left
                              ${isSelected 
                                  ? 'border-indigo-600 ring-2 ring-indigo-200 bg-indigo-50 z-10' 
                                  : 'border-gray-100 hover:border-indigo-300 bg-white'
                              }
                            `}
                          >
                            <span className={`text-sm font-semibold ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                              {cell.day}
                            </span>
                            
                            <div className="space-y-1 w-full">
                              {cell.income > 0 && (
                                <div className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-medium truncate">
                                  +{formatCurrency(cell.income)}
                                </div>
                              )}
                              {cell.expense > 0 && (
                                <div className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-medium truncate">
                                  -{formatCurrency(cell.expense)}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* --- YEARLY BAR CHART --- */
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                      <Tooltip 
                        contentStyle={{
                            borderRadius: '8px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            backgroundColor: '#fff',
                            color: '#000'
                        }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" fill="#f43f5e" name="Expense" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Subcomponent: Stat Card ---
function StatCard({ title, amount, icon, color }: { title: string; amount: number; icon: React.ReactNode; color: string }) {
  // StatCard uses parent context styles or simple backgrounds, so it works in both modes.
  // However, we need to ensure the text color adapts or we pass props if needed.
  // Since we are duplicating returns, the wrapper around StatCard handles the theme context (via Tailwind's 'dark' class).
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 transition-colors">
      <div className={`p-4 rounded-xl shadow-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(amount)}</p>
      </div>
    </div>
  );
}