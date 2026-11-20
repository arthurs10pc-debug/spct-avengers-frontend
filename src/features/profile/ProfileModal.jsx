import React from 'react';
import { X, Image, Coins, DollarSign, CheckSquare } from 'lucide-react';

export default function ProfileModal({
  isOpen,
  onClose,
  userProfile,
  setUserProfile,
  onOpenDailyBhav,
  onOpenExpenses,
  onOpenNotes,
  onOpenPhotoStudio,
  onOpenAuth
}) {
  if (!isOpen || !userProfile) return null;

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
        className="modal-card profile-modal-card" 
        style={{ 
          background: 'linear-gradient(150deg, rgba(18, 23, 35, 0.94) 0%, rgba(9, 12, 19, 0.98) 100%)', 
          backdropFilter: 'blur(32px) saturate(190%)',
          WebkitBackdropFilter: 'blur(32px) saturate(190%)',
          borderRadius: '24px', 
          padding: '24px 20px', 
          width: '100%', 
          maxWidth: '340px', 
          position: 'relative', 
          border: '1px solid rgba(255, 255, 255, 0.20)', 
          color: '#FFFFFF', 
          textAlign: 'center', 
          boxShadow: 'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.55), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.08), 0 24px 60px rgba(0,0,0,0.75)',
          cursor: 'default'
        }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', border: '1px solid rgba(255, 255, 255, 0.22)', background: 'rgba(255, 255, 255, 0.12)', color: '#FFFFFF', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

        {userProfile.photo ? (
          <img 
            src={userProfile.photo} 
            alt={userProfile.name} 
            style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid rgba(255, 255, 255, 0.3)', margin: '0 auto 12px auto', display: 'block', objectFit: 'cover' }} 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.25)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '24px', fontWeight: '900' }}>
            {(userProfile.name || 'U').charAt(0).toUpperCase()}
          </div>
        )}

        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase' }}>{userProfile.name}</h3>
        <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '700' }}>{userProfile.email}</p>
        <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.55)', display: 'block', marginBottom: '14px', fontWeight: '800' }}>CONNECTED: {userProfile.connectedDate || 'ACTIVE'}</span>

        {/* Quick Access Tools for Mobile */}
        <div style={{ marginBottom: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Active Features
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            <button 
              type="button"
              onClick={() => { onClose(); if (onOpenDailyBhav) onOpenDailyBhav(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.18)', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}
            >
              <Coins size={14} color="#f59e0b" /> દૈનિક ભાવ
            </button>
            <button 
              type="button"
              onClick={() => { onClose(); if (onOpenExpenses) onOpenExpenses(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.18)', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}
            >
              <DollarSign size={14} color="#38bdf8" /> Expenses
            </button>
            <button 
              type="button"
              onClick={() => { onClose(); if (onOpenNotes) onOpenNotes(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.18)', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}
            >
              <CheckSquare size={14} color="#4ade80" /> Keep Notes
            </button>
            <button 
              type="button"
              onClick={() => { onClose(); if (onOpenPhotoStudio) onOpenPhotoStudio(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.18)', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}
            >
              <Image size={14} color="#ec4899" /> AI Studio
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to disconnect / log out?")) {
                try {
                  if (window.google?.accounts?.id) {
                    window.google.accounts.id.disableAutoSelect();
                  }
                } catch (e) {}
                setUserProfile(null);
                localStorage.removeItem('jarvis_user_profile');
                onClose();
              }
            }}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', fontWeight: '900', fontSize: '12px', cursor: 'pointer', textTransform: 'uppercase' }}
          >
            DISCONNECT / LOG OUT
          </button>

          <button 
            onClick={() => {
              onClose();
              if (onOpenAuth) onOpenAuth();
            }}
            style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.22)', backgroundColor: 'rgba(255, 255, 255, 0.12)', color: '#FFFFFF', fontWeight: '900', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase' }}
          >
            SWITCH ACCOUNT
          </button>
        </div>
      </div>
    </div>
  );
}
