import React, { useState } from 'react';
import { 
  X, Clock, ChevronDown, Check, Plus, Edit2, Trash2, 
  RotateCw, AlertTriangle, Zap, Volume2, Shield 
} from 'lucide-react';

export default function WatcherModal({
  isOpen,
  onClose,
  remindersList,
  setRemindersList,
  snoozeMinutes,
  setSnoozeMinutes,
  activeAlertTask,
  setActiveAlertTask,
  activeAlertKey,
  setActiveAlertKey,
  currentAlertTaskId,
  setCurrentAlertTaskId,
  stopAlarmSound,
  setShowPermissionsModal,
  userProfile,
  socketRef,
  backendUrl
}) {
  const getCurrentTimeString = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const [currentTaskInput, setCurrentTaskInput] = useState('');
  const [currentTimeInput, setCurrentTimeInput] = useState(getCurrentTimeString());
  const [editingIndex, setEditingIndex] = useState(null);
  const [showSnoozeDropdown, setShowSnoozeDropdown] = useState(false);
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);
  const [pushFeedbackMessage, setPushFeedbackMessage] = useState('');

  if (!isOpen) return null;

  const handleSnooze = () => {
    if (stopAlarmSound) stopAlarmSound();
    setActiveAlertTask(null);
    setActiveAlertKey(null);
    setCurrentAlertTaskId(null);
  };

  const handleAddOrUpdateReminder = (e) => {
    e.preventDefault();
    if (!currentTaskInput.trim()) {
      alert('Please enter reminder task.');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...remindersList];
      updated[editingIndex] = { ...updated[editingIndex], task: currentTaskInput.trim(), time: currentTimeInput };
      setRemindersList(updated);
      try {
        localStorage.setItem('jarvis_permanent_reminders', JSON.stringify(updated));
      } catch (err) {}
      setEditingIndex(null);
    } else {
      const updated = [...remindersList, { task: currentTaskInput.trim(), time: currentTimeInput, completed: false }];
      setRemindersList(updated);
      try {
        localStorage.setItem('jarvis_permanent_reminders', JSON.stringify(updated));
      } catch (err) {}
    }

    setCurrentTaskInput('');
    setCurrentTimeInput(getCurrentTimeString());
  };

  const handleEditReminder = (index) => {
    setCurrentTaskInput(remindersList[index].task);
    setCurrentTimeInput(remindersList[index].time);
    setEditingIndex(index);
  };

  const handleDeleteReminder = (index) => {
    const taskName = remindersList[index]?.task || 'this task';
    const confirmDelete = window.confirm(`Are you sure you want to delete "${taskName}" reminder? (Yes/No)`);
    if (confirmDelete) {
      const updated = remindersList.filter((_, idx) => idx !== index);
      setRemindersList(updated);
      try {
        localStorage.setItem('jarvis_permanent_reminders', JSON.stringify(updated));
      } catch (err) {}
      if (editingIndex === index) {
        setEditingIndex(null);
        setCurrentTaskInput('');
      }
    }
  };

  const handleSendTestWebPush = async () => {
    setIsSendingTestPush(true);
    setPushFeedbackMessage('');
    try {
      const res = await fetch(`${backendUrl}/api/push/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userProfile?.email || 'guest' })
      });
      const data = await res.json();
      setPushFeedbackMessage(data.message || 'Push sent!');
    } catch (err) {
      setPushFeedbackMessage('Error sending push: ' + err.message);
    } finally {
      setIsSendingTestPush(false);
    }
  };

  return (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="modal-overlay" 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 7, 12, 0.72)', backdropFilter: 'blur(28px) saturate(190%)', WebkitBackdropFilter: 'blur(28px) saturate(190%)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', cursor: 'pointer' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="modal-card watcher-modal-card" 
            style={{ 
              background: 'linear-gradient(150deg, rgba(18, 23, 35, 0.94) 0%, rgba(9, 12, 19, 0.98) 100%)', 
              backdropFilter: 'blur(32px) saturate(190%)',
              WebkitBackdropFilter: 'blur(32px) saturate(190%)',
              borderRadius: '24px', 
              padding: window.innerWidth < 640 ? '16px' : '24px', 
              width: '100%', 
              maxWidth: '440px', 
              position: 'relative', 
              border: '1px solid rgba(255, 255, 255, 0.20)', 
              color: '#FFFFFF', 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              WebkitOverflowScrolling: 'touch',
              boxShadow: 'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.55), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.08), 0 24px 60px rgba(0, 0, 0, 0.75)',
              cursor: 'default'
            }}
          >
            <button onClick={() => onClose()} style={{ position: 'absolute', top: '16px', right: '16px', border: '1px solid rgba(255, 255, 255, 0.22)', background: 'rgba(255, 255, 255, 0.12)', color: '#FFFFFF', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingRight: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.22)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.3px' }}>Permanent Watcher Reminders</h3>
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '800' }}>Rechecks every day • Stays set until deleted</span>
                </div>
              </div>
            </div>

            {/* Desktop Notification Status Banner */}
            {'Notification' in window && Notification.permission !== 'granted' && (
              <div style={{ marginBottom: '12px', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10.5px', color: '#fcd34d', fontWeight: '800' }}>🔔 Browser alerts disabled</span>
                <button
                  type="button"
                  onClick={() => {
                    Notification.requestPermission().then(p => {
                      alert(`Notification permission is: ${p}`);
                    });
                  }}
                  style={{ background: '#f59e0b', color: '#000000', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' }}
                >
                  Enable Notifications
                </button>
              </div>
            )}

            <form onSubmit={handleAddOrUpdateReminder} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Enter reminder task..."
                  value={currentTaskInput}
                  onChange={(e) => setCurrentTaskInput(e.target.value)}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', fontSize: '11px', outline: 'none', fontWeight: '700' }}
                />
                <input
                  type="time"
                  value={currentTimeInput}
                  onChange={(e) => setCurrentTimeInput(e.target.value)}
                  style={{ width: '105px', padding: '9px 8px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', fontSize: '11px', outline: 'none', fontWeight: '800' }}
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.5)', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 243, 248, 0.85) 100%)', color: '#0b0f19', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: 'inset 0 1px 1px #fff, 0 4px 15px rgba(0,0,0,0.35)' }}>
                <Plus size={15} /> {editingIndex !== null ? "Update Reminder" : "Add Permanent Reminder"}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px', marginBottom: '14px' }}>
              {sortedReminders.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px', margin: '16px 0', fontWeight: '700' }}>No reminders set. Add your daily routine reminder above!</p>
              ) : (
                sortedReminders.map((rem, idx) => {
                  const originalIndex = remindersList.findIndex(r => r.task === rem.task && r.time === rem.time);
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        backgroundColor: 'rgba(255, 255, 255, 0.07)', 
                        border: '1px solid rgba(255, 255, 255, 0.16)', 
                        borderRadius: '10px', 
                        padding: '10px 12px',
                        opacity: rem.completed ? 0.75 : 1
                      }}
                    >
                      <div style={{ overflow: 'hidden', paddingRight: '8px', flex: 1 }}>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '12px', 
                          fontWeight: '900', 
                          color: rem.completed ? '#4ade80' : '#FFFFFF', 
                          textDecoration: rem.completed ? 'line-through' : 'none', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          {rem.task} {rem.completed && "✓"}
                        </p>
                        <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '800' }}>
                          Time: {formatTimeTo12Hour(rem.time)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                        {/* Only triggered reminders get the green checkmark badge */}
                        {rem.completed && (
                          <div 
                            title="Triggered for Today" 
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: '6px', 
                              backgroundColor: 'rgba(34, 197, 94, 0.2)', 
                              border: '1px solid rgba(34, 197, 94, 0.4)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              color: '#4ade80' 
                            }}
                          >
                            <Check size={14} />
                          </div>
                        )}
                        <button onClick={() => handleEditReminder(originalIndex)} style={{ background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.22)', color: '#FFFFFF', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Edit Reminder"><Edit2 size={13} /></button>
                        <button onClick={() => handleDeleteReminder(originalIndex)} style={{ background: 'rgba(239, 68, 68, 0.25)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Delete Reminder"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Watcher Modal Action Controls */}
            <div style={{ position: 'relative', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button 
                type="button"
                onClick={triggerTestWatcherAlert}
                title="Instantly Test Watcher Alert (Sound, Modal & Notification)"
                style={{ flex: '1 1 120px', background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.22)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
              >
                <Zap size={12} /> Test Alert Now
              </button>

              <button 
                onClick={() => setShowSnoozeDropdown(!showSnoozeDropdown)}
                title="Snooze Settings"
                style={{ background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.22)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Moon size={12} /> ZZZ ({snoozeMinutes}m)
              </button>

              {showSnoozeDropdown && (
                <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '6px', backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '6px', zIndex: 300, display: 'flex', flexDirection: 'column', gap: '3px', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
                  <span style={{ fontSize: '9px', fontWeight: '900', color: '#64748b', paddingLeft: '4px' }}>Select Snooze:</span>
                  {[1, 5, 10, 15, 30].map((m) => (
                    <button 
                      key={m} 
                      onClick={() => { setSnoozeMinutes(m); setShowSnoozeDropdown(false); }}
                      style={{ background: snoozeMinutes === m ? '#0f172a' : 'transparent', color: snoozeMinutes === m ? '#ffffff' : '#0f172a', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', textAlign: 'left' }}
                    >
                      {m} Minute{m > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Full-Screen Watcher Reminder Alert Modal (Apple iOS 26 Liquid Glass) */}
      {activeAlertTask && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              stopAlarmSound();
              setActiveAlertTask(null);
              setActiveAlertKey(null);
              setCurrentAlertTaskId(null);
            }
          }}
          className="modal-overlay"
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(5, 7, 12, 0.78)', 
            backdropFilter: 'blur(28px) saturate(190%)', 
            WebkitBackdropFilter: 'blur(28px) saturate(190%)', 
            zIndex: 99999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '16px',
            cursor: 'pointer'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="watcher-alert-card modal-card"
            style={{
              background: 'linear-gradient(150deg, rgba(22, 27, 40, 0.92) 0%, rgba(10, 13, 22, 0.98) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.24)',
              borderRadius: '36px',
              padding: window.innerWidth < 640 ? '32px 20px 28px 20px' : '44px 36px 36px 36px',
              maxWidth: '520px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: 'inset 0 2px 2px 0 rgba(255, 255, 255, 0.7), inset 0 -1.5px 1.5px 0 rgba(255, 255, 255, 0.08), 0 32px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(239, 68, 68, 0.22)',
              cursor: 'default',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Ambient Red Glow Orb behind Icon */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.35) 0%, rgba(239, 68, 68, 0) 70%)',
              pointerEvents: 'none',
              filter: 'blur(25px)'
            }} />

            {/* Apple iOS Squircle Liquid Glass Bell App Icon */}
            <div style={{ 
              width: '88px', 
              height: '88px', 
              borderRadius: '26px', 
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(185, 28, 28, 0.98) 100%)', 
              color: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              boxShadow: 'inset 0 2px 2px rgba(255, 255, 255, 0.85), inset 0 -2px 2px rgba(0, 0, 0, 0.3), 0 16px 36px rgba(220, 38, 38, 0.55), 0 0 32px rgba(239, 68, 68, 0.4)',
              position: 'relative'
            }}>
              <Bell size={44} style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
            </div>

            {/* iOS Pill Badge */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.16)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '9999px',
              padding: '5px 14px',
              marginBottom: '12px',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.25)'
            }}>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: '900', 
                color: '#FCA5A5', 
                textTransform: 'uppercase', 
                letterSpacing: '1.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block', boxShadow: '0 0 8px #EF4444' }} />
                Watcher Reminder Alert
              </span>
            </div>

            {/* Big Bold Reminder Name */}
            <h1 style={{ 
              fontSize: window.innerWidth < 640 ? '24px' : '30px', 
              fontWeight: '900', 
              color: '#FFFFFF', 
              lineHeight: '1.25', 
              margin: '0 0 8px 0', 
              padding: '0 8px',
              wordBreak: 'break-word',
              textShadow: '0 2px 14px rgba(0, 0, 0, 0.5)'
            }}>
              "{activeAlertTask}"
            </h1>

            {/* Subtitle */}
            <p style={{ margin: '0 0 32px 0', fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.72)', fontWeight: '600' }}>
              Scheduled reminder time has arrived!
            </p>

            {/* iOS 26 Liquid Glass Buttons Row */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              <button
                type="button"
                onClick={() => {
                  try {
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      const utter = new SpeechSynthesisUtterance(`Reminder alert: ${activeAlertTask}`);
                      utter.rate = 0.95;
                      utter.pitch = 1.0;
                      window.speechSynthesis.speak(utter);
                    }
                  } catch (e) {}
                }}
                className="liquid-glass-btn touch-btn"
                style={{
                  padding: '12px 20px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255, 255, 255, 0.24)',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.04) 100%)',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.5), inset 0 -1px 1px rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.35)',
                  transition: 'transform 0.15s ease, background 0.15s ease'
                }}
              >
                <Volume2 size={16} /> Speak Again
              </button>

              <button
                type="button"
                onClick={() => {
                  stopAlarmSound();
                  setActiveAlertTask(null);
                  setActiveAlertKey(null);
                  setCurrentAlertTaskId(null);
                }}
                className="liquid-glass-btn touch-btn"
                style={{ 
                  padding: '12px 30px', 
                  borderRadius: '9999px', 
                  border: '1px solid rgba(255, 255, 255, 0.75)', 
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)', 
                  color: '#0F172A', 
                  fontWeight: '900', 
                  fontSize: '14.5px', 
                  cursor: 'pointer',
                  boxShadow: 'inset 0 1.5px 1.5px #FFFFFF, 0 8px 26px rgba(255, 255, 255, 0.35), 0 4px 12px rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'transform 0.15s ease'
                }}
              >
                <Check size={17} strokeWidth={3} /> Got It
              </button>

              <button
                type="button"
                onClick={handleSnooze}
                className="liquid-glass-btn touch-btn"
                style={{ 
                  padding: '12px 22px', 
                  borderRadius: '9999px', 
                  border: '1px solid rgba(255, 255, 255, 0.24)',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.04) 100%)', 
                  color: '#FFFFFF', 
                  fontWeight: '800', 
                  fontSize: '13.5px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  boxShadow: 'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.5), inset 0 -1px 1px rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.35)',
                  transition: 'transform 0.15s ease, background 0.15s ease'
                }}
              >
                <Clock size={16} /> Snooze ({snoozeMinutes}m)
              </button>
            </div>
          </div>
        </div>
  );
}
