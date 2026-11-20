import React from 'react';
import { Bell, Volume2, Check, Clock, Music } from 'lucide-react';

export default function ReminderAlertModal({
  activeAlertTask,
  onDismiss,
  onSnooze,
  snoozeMinutes = 5
}) {
  if (!activeAlertTask) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
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
          padding: typeof window !== 'undefined' && window.innerWidth < 640 ? '32px 20px 28px 20px' : '44px 36px 36px 36px',
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

        {/* Music Playing Indicator */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(59, 130, 246, 0.2)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '20px',
          padding: '4px 12px',
          marginBottom: '10px'
        }}>
          <Music size={13} color="#93c5fd" />
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#93c5fd' }}>
            Playing Reminder Music 🔔
          </span>
        </div>

        {/* Big Bold Reminder Name */}
        <h1 style={{ 
          fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '24px' : '30px', 
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

        {/* iOS Liquid Glass Buttons Row */}
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
            onClick={onDismiss}
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
            onClick={onSnooze}
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
