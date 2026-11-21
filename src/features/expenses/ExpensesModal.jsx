import React, { useState } from 'react';
import { 
  X, DollarSign, FileSpreadsheet, Trash2, Calendar, 
  TrendingUp, TrendingDown, ArrowUpRight, BarChart2, 
  Edit2, Plus, Download, Check 
} from 'lucide-react';

export default function ExpensesModal({
  isOpen,
  onClose,
  expenseList,
  setExpenseList,
  monthlyBudget,
  setMonthlyBudget,
  selectedExpenseMonth,
  setSelectedExpenseMonth,
  userProfile,
  socketRef,
  backendUrl
}) {
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food & Snacks');
  const [transactionType, setTransactionType] = useState('expense');
  const [expenseTabMode, setExpenseTabMode] = useState('tracker');
  const [isSettingBudget, setIsSettingBudget] = useState(false);
  const [tempBudgetInput, setTempBudgetInput] = useState('');

  if (!isOpen) return null;

  const isExpenseInMonth = (item, ymStr) => {
    if (!item || !ymStr) return false;
    if (item.date && String(item.date).startsWith(ymStr)) return true;
    if (item.createdAt) {
      const d = new Date(item.createdAt);
      if (!isNaN(d.getTime())) {
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (ym === ymStr) return true;
      }
    }
    return false;
  };

  const formatExpenseMonthLabel = (monthStr) => {
    if (!monthStr) return '';
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch (e) {
      return monthStr;
    }
  };

  const handlePrevExpenseMonth = () => {
    setSelectedExpenseMonth(prev => {
      try {
        const [year, month] = prev.split('-').map(Number);
        const d = new Date(year, month - 2, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } catch (e) {
        return prev;
      }
    });
  };

  const handleNextExpenseMonth = () => {
    setSelectedExpenseMonth(prev => {
      try {
        const [year, month] = prev.split('-').map(Number);
        const d = new Date(year, month, 1);
        const now = new Date();
        const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const nextYm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (nextYm > currentYm) return currentYm;
        return nextYm;
      } catch (e) {
        return prev;
      }
    });
  };

  const nowObj = new Date();
  const currentYm = `${nowObj.getFullYear()}-${String(nowObj.getMonth() + 1).padStart(2, '0')}`;
  const isFutureMonthBlocked = selectedExpenseMonth >= currentYm;

  const handleAddExpense = (e) => {
    if (e) e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) {
      alert('Please enter both title and amount.');
      return;
    }
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = `${ym}-${String(now.getDate()).padStart(2, '0')}`;
    const newExp = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      type: transactionType || 'expense',
      title: expenseTitle.trim(),
      amount: parseFloat(expenseAmount),
      category: transactionType === 'income' ? (expenseCategory || 'Salary & Wages') : (expenseCategory || 'Food & Snacks'),
      date: dateStr,
      createdAt: Date.now()
    };

    setExpenseList(prev => {
      const updated = [newExp, ...(prev || []).filter(item => item && item.id !== newExp.id)];
      try {
        localStorage.setItem('jarvis_expenses', JSON.stringify(updated));
        localStorage.setItem('jarvis_expenses_sataparahetkumar@gmail.com', JSON.stringify(updated));
        if (userProfile?.email) {
          localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify(updated));
        }
      } catch (err) {}
      return updated;
    });

    setExpenseTitle('');
    setExpenseAmount('');

    if (userProfile?.email) {
      const cleanEmail = userProfile.email.trim().toLowerCase();
      if (socketRef?.current?.connected) {
        socketRef.current.emit('sync_user_data_realtime', {
          email: cleanEmail,
          expenses: [newExp, ...(expenseList || [])],
          monthlyBudget
        });
      }
      fetch(`${backendUrl}/api/expenses/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, expense: newExp }),
        keepalive: true
      }).catch(err => console.warn('Instant expense sync backgrounded:', err));
    }
  };

  const handleQuickAddExpense = (title, amount, category) => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = `${ym}-${String(now.getDate()).padStart(2, '0')}`;
    const newExp = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      type: 'expense',
      title: (title || 'Expense').trim(),
      amount: parseFloat(amount) || 0,
      category: category || 'Food & Snacks',
      date: dateStr,
      createdAt: Date.now()
    };

    setExpenseList(prev => {
      const updated = [newExp, ...(prev || []).filter(item => item && item.id !== newExp.id)];
      try {
        localStorage.setItem('jarvis_expenses', JSON.stringify(updated));
        localStorage.setItem('jarvis_expenses_sataparahetkumar@gmail.com', JSON.stringify(updated));
        if (userProfile?.email) {
          localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify(updated));
        }
      } catch (err) {}
      return updated;
    });

    if (userProfile?.email) {
      const cleanEmail = userProfile.email.trim().toLowerCase();
      if (socketRef?.current?.connected) {
        socketRef.current.emit('sync_user_data_realtime', {
          email: cleanEmail,
          expenses: [newExp, ...(expenseList || [])],
          monthlyBudget
        });
      }
      fetch(`${backendUrl}/api/expenses/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, expense: newExp }),
        keepalive: true
      }).catch(() => {});
    }
  };

  const handleExportExpensesCSV = () => {
    if (!expenseList || expenseList.length === 0) {
      alert('No expenses to export.');
      return;
    }
    const headers = ['Date', 'Title', 'Category', 'Amount (INR)'];
    const rows = expenseList.map(item => [
      `"${item.date || ''}"`,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.category || 'General').replace(/"/g, '""')}"`,
      item.amount || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jarvis_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAllExpenses = () => {
    if (window.confirm('Are you sure you want to clear all expense records?')) {
      const allIds = (expenseList || []).map(e => String(e.id || '')).filter(Boolean);
      try {
        const raw = localStorage.getItem('jarvis_deleted_expense_ids');
        const deletedIds = raw ? JSON.parse(raw) : [];
        const mergedDeleted = Array.from(new Set([...deletedIds, ...allIds]));
        localStorage.setItem('jarvis_deleted_expense_ids', JSON.stringify(mergedDeleted.slice(-300)));
      } catch (e) {}

      setExpenseList([]);
      try {
        localStorage.setItem('jarvis_expenses', JSON.stringify([]));
        if (userProfile?.email) {
          localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify([]));
        }
      } catch (err) {}

      if (userProfile?.email) {
        const cleanEmail = userProfile.email.trim().toLowerCase();
        if (socketRef?.current?.connected) {
          socketRef.current.emit('sync_user_data_realtime', {
            email: cleanEmail,
            expenses: [],
            isClearAllExpenses: true
          });
        }
        fetch(`${backendUrl}/api/expenses/clear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
          keepalive: true
        }).catch(() => {});
      }
    }
  };

  const handleDeleteExpense = (target) => {
    const targetId = typeof target === 'object' ? target?.id : target;
    const exp = (expenseList || []).find(e => String(e.id) === String(targetId)) ||
      (typeof target === 'number' ? expenseList[target] : null) ||
      (typeof target === 'object' ? target : null);

    if (!exp) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete "${exp.title || 'this expense'}" (₹${exp.amount})?`);
    if (!confirmDelete) return;

    const expId = String(exp.id || targetId || `tx_${exp.date || ''}_${exp.title || ''}_${exp.amount || ''}`);

    try {
      const raw = localStorage.getItem('jarvis_deleted_expense_ids');
      const deletedIds = raw ? JSON.parse(raw) : [];
      if (expId && !deletedIds.includes(expId)) {
        deletedIds.push(expId);
        localStorage.setItem('jarvis_deleted_expense_ids', JSON.stringify(deletedIds.slice(-300)));
      }
    } catch (e) {}

    setExpenseList(prev => {
      const updated = prev.filter(e => {
        if (expId && e.id) return String(e.id) !== expId;
        return !(e.title === exp.title && e.amount === exp.amount && e.date === exp.date);
      });
      try {
        localStorage.setItem('jarvis_expenses', JSON.stringify(updated));
        if (userProfile?.email) {
          localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify(updated));
        }
      } catch (err) {}
      return updated;
    });

    if (userProfile?.email) {
      const cleanEmail = userProfile.email.trim().toLowerCase();
      if (socketRef?.current?.connected) {
        socketRef.current.emit('sync_user_data_realtime', {
          email: cleanEmail,
          deletedExpenseIds: [expId],
          expenses: (expenseList || []).filter(e => String(e.id) !== expId),
          monthlyBudget
        });
      }
      fetch(`${backendUrl}/api/expenses/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, expenseId: expId }),
        keepalive: true
      }).catch(() => {});
    }
  };

  const monthlyExpenses = (expenseList || []).filter(item => item && item.type !== 'income');
  const monthlyItems = monthlyExpenses.filter(item => isExpenseInMonth(item, selectedExpenseMonth));
  const monthlySpent = monthlyItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  const monthlyRemainingBudget = monthlyBudget - monthlySpent;
  const budgetPct = monthlyBudget > 0 ? Math.min(Math.round((monthlySpent / monthlyBudget) * 100), 100) : 0;

  const catMap = {};
  monthlyItems.forEach(i => {
    const cat = i.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + (parseFloat(i.amount) || 0);
  });
  const categoryStats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const topCat = categoryStats.length > 0 ? categoryStats[0] : null;

  const now = new Date();
  const currentDay = Math.max(1, now.getDate());
  const avgDailySpend = Math.round(monthlySpent / currentDay);

  return (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
            className="modal-overlay" 
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 7, 12, 0.72)', backdropFilter: 'blur(28px) saturate(190%)', WebkitBackdropFilter: 'blur(28px) saturate(190%)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', cursor: 'pointer' }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="modal-card expense-modal-card" 
              style={{ 
                background: 'linear-gradient(150deg, rgba(18, 23, 35, 0.94) 0%, rgba(9, 12, 19, 0.98) 100%)', 
                backdropFilter: 'blur(32px) saturate(190%)',
                WebkitBackdropFilter: 'blur(32px) saturate(190%)',
                borderRadius: '24px', 
                padding: window.innerWidth < 640 ? '14px' : '24px', 
                width: '100%', 
                maxWidth: '750px', 
                position: 'relative', 
                border: '1px solid rgba(255, 255, 255, 0.20)', 
                color: '#FFFFFF', 
                maxHeight: '92vh', 
                overflowY: 'auto', 
                WebkitOverflowScrolling: 'touch',
                boxSizing: 'border-box', 
                boxShadow: 'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.55), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.08), 0 24px 60px rgba(0,0,0,0.75)',
                cursor: 'default'
              }}
            >
              <button onClick={() => onClose()} style={{ position: 'absolute', top: '14px', right: '14px', border: '1px solid rgba(255, 255, 255, 0.22)', background: 'rgba(255, 255, 255, 0.12)', color: '#FFFFFF', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingRight: '36px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.22)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase' }}>Shadow Expense Manager</h3>
                    <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '800' }}>DAILY SPENDS & FINANCIAL ANALYTICS</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleExportExpensesCSV} title="Download CSV / Excel" style={{ background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.22)', color: '#FFFFFF', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>
                    <FileSpreadsheet size={14} /> EXPORT CSV
                  </button>
                  <button onClick={handleClearAllExpenses} title="Clear All Records" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '900' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Month Selector Bar - Responsive & Overflow Protected */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: '12px', padding: '8px 12px', marginBottom: '16px', color: '#FFFFFF', flexWrap: 'wrap', gap: '8px' }}>
                <button onClick={handlePrevExpenseMonth} style={{ background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.22)', color: '#FFFFFF', padding: '6px 11px', borderRadius: '8px', fontSize: '10.5px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', flex: '0 0 auto' }}>
                  ◀ PREV MONTH
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900', fontSize: '13px', letterSpacing: '0.5px', color: '#FFFFFF', flex: '1 1 auto', justifyContent: 'center' }}>
                  <Calendar size={15} color="#38bdf8" />
                  <span>{formatExpenseMonthLabel(selectedExpenseMonth)}</span>
                  {isFutureMonthBlocked && (
                    <span style={{ fontSize: '9px', backgroundColor: '#38bdf8', color: '#0b0f19', padding: '2px 6px', borderRadius: '4px', fontWeight: '900', textTransform: 'uppercase' }}>CURRENT</span>
                  )}
                </div>
                <button 
                  onClick={handleNextExpenseMonth} 
                  disabled={isFutureMonthBlocked}
                  style={{ 
                    background: isFutureMonthBlocked ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.12)', 
                    border: `1px solid ${isFutureMonthBlocked ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.22)'}`,
                    color: isFutureMonthBlocked ? 'rgba(255, 255, 255, 0.35)' : '#FFFFFF', 
                    padding: '6px 11px', 
                    borderRadius: '8px', 
                    fontSize: '10.5px', 
                    fontWeight: '900', 
                    cursor: isFutureMonthBlocked ? 'not-allowed' : 'pointer',
                    opacity: isFutureMonthBlocked ? 0.5 : 1,
                    textTransform: 'uppercase',
                    flex: '0 0 auto'
                  }}
                  title={isFutureMonthBlocked ? "Current month" : "Next Month"}
                >
                  NEXT MONTH ▶
                </button>
              </div>

              {/* 3-Card Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                {/* 1. Total Spent */}
                <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '14px', padding: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#f87171', textTransform: 'uppercase' }}>TOTAL SPENT</span>
                    <TrendingDown size={16} color="#f87171" />
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: '900', color: '#f87171' }}>₹{monthlySpent.toLocaleString()}</p>
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '800' }}>{monthlyItems.length} expenses logged</span>
                </div>

                {/* 2. Monthly Budget */}
                <div style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)', border: '1px solid rgba(255, 255, 255, 0.18)', borderRadius: '14px', padding: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase' }}>MONTHLY BUDGET</span>
                    <button 
                      onClick={() => setIsSettingBudget(prev => !prev)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FFFFFF', padding: 0 }}
                      title="Edit monthly budget"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                  {isSettingBudget ? (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                      <input
                        type="number"
                        value={tempBudgetInput}
                        onChange={(e) => setTempBudgetInput(e.target.value)}
                        placeholder="New ₹"
                        style={{ width: '85px', padding: '5px 8px', fontSize: '13px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', fontWeight: '800' }}
                      />
                      <button
                        onClick={() => {
                          const nb = parseFloat(tempBudgetInput);
                          if (!isNaN(nb) && nb > 0) {
                            setMonthlyBudget(nb);
                            localStorage.setItem('jarvis_monthly_budget', String(nb));
                          }
                          setIsSettingBudget(false);
                        }}
                        style={{ backgroundColor: '#FFFFFF', color: '#0b0f19', border: 'none', borderRadius: '6px', fontSize: '11px', padding: '5px 10px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}
                      >
                        SAVE
                      </button>
                    </div>
                  ) : (
                    <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: '900', color: '#FFFFFF' }}>₹{monthlyBudget.toLocaleString()}</p>
                  )}
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '800' }}>Target spending limit</span>
                </div>

                {/* 3. Budget Remaining */}
                <div style={{ background: monthlyRemainingBudget >= 0 ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)', border: `1px solid ${monthlyRemainingBudget >= 0 ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`, borderRadius: '14px', padding: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: monthlyRemainingBudget >= 0 ? '#4ade80' : '#f87171', textTransform: 'uppercase' }}>BUDGET REMAINING</span>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: monthlyRemainingBudget >= 0 ? '#4ade80' : '#f87171' }}>{budgetPct}% used</span>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: '900', color: monthlyRemainingBudget >= 0 ? '#4ade80' : '#f87171' }}>
                    {monthlyRemainingBudget >= 0 ? `₹${monthlyRemainingBudget.toLocaleString()}` : `-₹${Math.abs(monthlyRemainingBudget).toLocaleString()}`}
                  </p>
                  <span style={{ fontSize: '10px', color: monthlyRemainingBudget >= 0 ? '#4ade80' : '#f87171', fontWeight: '800' }}>
                    {monthlyRemainingBudget >= 0 ? 'Within budget limit' : 'Over budget!'}
                  </span>
                </div>
              </div>

              {/* Monthly Budget Progress Bar */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: '900', marginBottom: '8px', color: '#FFFFFF', flexWrap: 'wrap', gap: '4px' }}>
                  <span>🎯 MONTHLY PROGRESS: ₹{monthlySpent.toLocaleString()} OF ₹{monthlyBudget.toLocaleString()}</span>
                  <span style={{ color: monthlyRemainingBudget >= 0 ? '#4ade80' : '#f87171' }}>
                    {monthlyRemainingBudget >= 0 ? `₹${monthlyRemainingBudget.toLocaleString()} REMAINING (${budgetPct}% USED)` : `⚠️ OVER BUDGET BY ₹${Math.abs(monthlyRemainingBudget).toLocaleString()}`}
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.12)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${budgetPct}%`, backgroundColor: budgetPct > 90 ? '#ef4444' : (budgetPct > 70 ? '#f59e0b' : '#22c55e'), borderRadius: '4px', transition: 'width 0.3s ease' }} />
                </div>
              </div>

              {/* Expense Creator */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.16)', marginBottom: '16px' }}>
                {/* 1-Tap Quick Presets */}
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                    ⚡ 1-TAP QUICK PRESETS:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {[
                      { t: 'Chai & Snacks', a: 20, c: 'Food & Snacks' },
                      { t: 'Metro / Bus', a: 50, c: 'Travel & Commute' },
                      { t: 'Lunch / Thali', a: 120, c: 'Food & Snacks' },
                      { t: 'Petrol / Fuel', a: 100, c: 'Travel & Commute' },
                      { t: 'Stationery / Print', a: 60, c: 'Shopping & Books' },
                      { t: 'Daily Groceries', a: 250, c: 'Groceries' },
                      { t: 'Mobile Recharge', a: 299, c: 'Bills & Utilities' }
                    ].map(p => (
                      <button
                        key={p.t}
                        type="button"
                        onClick={() => { setExpenseTitle(p.t); setExpenseAmount(String(p.a)); setExpenseCategory(p.c); }}
                        style={{
                          padding: '6px 11px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.20)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        + {p.t} ₹{p.a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Input Line */}
                <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="expense-form-grid" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      className="expense-form-input expense-title-input"
                      placeholder="Expense Title (e.g. Chai, Groceries, Petrol, Books)..."
                      value={expenseTitle}
                      onChange={(e) => setExpenseTitle(e.target.value)}
                      style={{ flex: '2 1 200px', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', fontSize: '12px', outline: 'none', fontWeight: '800' }}
                    />
                    <input
                      type="number"
                      className="expense-form-input expense-amount-input"
                      placeholder="₹ Amount"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      style={{ flex: '1 1 100px', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', fontSize: '12px', outline: 'none', fontWeight: '900' }}
                    />
                    <select
                      className="expense-form-input expense-cat-select"
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      style={{ flex: '1.5 1 140px', padding: '10px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(18, 23, 35, 0.95)', color: '#FFFFFF', fontSize: '11px', outline: 'none', fontWeight: '800' }}
                    >
                      <option value="Food & Snacks">🍔 Food & Snacks</option>
                      <option value="Travel & Commute">🚌 Travel & Commute</option>
                      <option value="Groceries">🛒 Groceries</option>
                      <option value="Bills & Utilities">⚡ Bills & Utilities</option>
                      <option value="Shopping & Books">🛍️ Shopping & Books</option>
                      <option value="Health & Medical">💊 Health & Medical</option>
                      <option value="Other Expense">📦 Other Expense</option>
                    </select>
                    <button 
                      type="submit" 
                      className="touch-btn expense-form-submit-btn"
                      style={{ 
                        padding: '10px 22px', 
                        borderRadius: '8px', 
                        border: '1px solid rgba(255, 255, 255, 0.5)', 
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 243, 248, 0.85) 100%)', 
                        color: '#0b0f19', 
                        fontWeight: '900', 
                        fontSize: '12px', 
                        cursor: 'pointer', 
                        whiteSpace: 'nowrap',
                        boxShadow: 'inset 0 1px 1px #fff, 0 2px 8px rgba(0,0,0,0.35)',
                        textTransform: 'uppercase'
                      }}
                    >
                      + LOG EXPENSE
                    </button>
                  </div>
                </form>
              </div>

              {/* Clear Content Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => setExpenseTabMode('tracker')}
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: '1px solid ' + (expenseTabMode === 'tracker' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.16)'),
                    background: expenseTabMode === 'tracker' ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 243, 248, 0.85) 100%)' : 'rgba(255, 255, 255, 0.08)',
                    color: expenseTabMode === 'tracker' ? '#0b0f19' : 'rgba(255, 255, 255, 0.8)',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textTransform: 'uppercase'
                  }}
                >
                  <Edit2 size={13} /> EXPENSES LIST ({monthlyItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseTabMode('monthly_report')}
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: '1px solid ' + (expenseTabMode === 'monthly_report' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.16)'),
                    background: expenseTabMode === 'monthly_report' ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 243, 248, 0.85) 100%)' : 'rgba(255, 255, 255, 0.08)',
                    color: expenseTabMode === 'monthly_report' ? '#0b0f19' : 'rgba(255, 255, 255, 0.8)',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textTransform: 'uppercase'
                  }}
                >
                  <BarChart2 size={13} /> MONTHLY ANALYTICS & REPORT
                </button>
              </div>

              {/* Tab 1: Expenses List */}
              {expenseTabMode === 'tracker' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {monthlyItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 12px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1.5px dashed rgba(255, 255, 255, 0.2)', color: 'rgba(255, 255, 255, 0.7)' }}>
                      <DollarSign size={32} color="#38bdf8" style={{ margin: '0 auto 8px auto', opacity: 0.7 }} />
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#FFFFFF' }}>
                        No expenses recorded for {formatExpenseMonthLabel(selectedExpenseMonth)}.
                      </p>
                      <span style={{ fontSize: '11px', fontWeight: '700' }}>Log your first expense using the quick presets above!</span>
                    </div>
                  ) : (
                    monthlyItems.map((item, idx) => {
                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            border: '1px solid rgba(255, 255, 255, 0.16)',
                            borderLeft: '4px solid #ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <TrendingDown size={14} />
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#FFFFFF' }}>{item.title}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '2px', fontWeight: '700' }}>
                                <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>{item.category}</span>
                                <span>•</span>
                                <span>{item.date || 'Today'}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '900', color: '#f87171' }}>
                              -₹{parseFloat(item.amount).toLocaleString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(item)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: 'rgba(255, 255, 255, 0.5)' }}
                              title="Delete expense"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 2: Monthly Analytics & Report */}
              {expenseTabMode === 'monthly_report' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Spending Velocity & Top Category Card */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: '12px', padding: '14px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase' }}>AVERAGE DAILY SPEND</span>
                      <p style={{ margin: '6px 0 0 0', fontSize: '22px', fontWeight: '900', color: '#FFFFFF' }}>
                        ₹{avgDailySpend.toLocaleString()} / day
                      </p>
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '700' }}>Based on {currentDay} days in {formatExpenseMonthLabel(selectedExpenseMonth)}</span>
                    </div>

                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: '12px', padding: '14px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase' }}>TOP SPENDING CATEGORY</span>
                      <p style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#f87171' }}>
                        {topCat ? topCat[0] : 'None Yet'}
                      </p>
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '700' }}>
                        {topCat ? `₹${topCat[1].toLocaleString()} (${monthlySpent > 0 ? Math.round((topCat[1] / monthlySpent) * 100) : 0}% of month)` : 'No expenses logged'}
                      </span>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: '12px', padding: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase' }}>
                      🏷️ Spending by Category ({formatExpenseMonthLabel(selectedExpenseMonth)})
                    </h4>
                    {categoryStats.length === 0 ? (
                      <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '700' }}>No expense records available for this month.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {categoryStats.map(([cat, amt]) => {
                          const pct = monthlySpent > 0 ? Math.round((amt / monthlySpent) * 100) : 0;
                          return (
                            <div key={cat}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '900', marginBottom: '3px', color: '#FFFFFF' }}>
                                <span>{cat}</span>
                                <span>₹{amt.toLocaleString()} ({pct}%)</span>
                              </div>
                              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.12)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#38bdf8', borderRadius: '4px' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
  );
}
