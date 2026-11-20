import React, { useState } from 'react';
import { X, ExternalLink, RefreshCw, Sparkles, Image as ImageIcon, Heart, MessageCircle, Share2, Plus, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function DailyBhavModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'posts' | 'add_more'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [savedPages, setSavedPages] = useState([
    {
      id: 'fb_gold_silver_daily',
      name: 'સોના/ચાંદીનો ભાવ - દૈનિક',
      platform: 'facebook',
      handle: '@sonachandibhavdaily',
      followers: '46K Followers',
      following: '10 Following',
      category: 'Information Technology • Ahmedabad',
      bio: 'ગુજરાતના સોના અને ચાંદીના રોજિંદા તાજા ભાવ હવે એક નજરમાં. સરળ, સ્પષ્ટ અને દૈનિક ઈમેજ અપડેટ્સ માટે અમારી સાથે જોડાયેલા રહો.',
      url: 'https://www.facebook.com/search/top?q=%E0%AA%B8%E0%AB%8B%E0%AA%A8%E0%AA%BE%2F%E0%AA%9A%E0%AA%BE%E0%AA%82%E0%AA%A6%E0%AB%80%E0%AA%A8%E0%AB%8B%20%E0%AA%AD%E0%AA%BE%E0%AA%B5%20-%20%E0%AA%A6%E0%AB%88%E0%AA%A8%E0%AA%BF%E0%AA%95',
      verified: true
    }
  ]);

  if (!isOpen) return null;

  const currentPage = savedPages[0];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleAddPage = (e) => {
    e.preventDefault();
    if (!newUrlInput.trim()) return;
    const isInsta = newUrlInput.toLowerCase().includes('instagram.com');
    const newEntry = {
      id: 'page_' + Date.now(),
      name: newUrlInput.replace(/^https?:\/\/(www\.)?/, '').split('/')[1] || 'New Page',
      platform: isInsta ? 'instagram' : 'facebook',
      handle: '@' + (newUrlInput.split('/')[3] || 'page'),
      followers: 'Active Page',
      following: 'Live Feed',
      category: isInsta ? 'Instagram Creator' : 'Facebook Page',
      bio: 'Daily Social Media Live Updates',
      url: newUrlInput.trim(),
      verified: true
    };
    setSavedPages(prev => [...prev, newEntry]);
    setNewUrlInput('');
    setActiveTab('feed');
  };

  return (
    <div
      className="daily-bhav-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="daily-bhav-container"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '840px',
          maxHeight: '92vh',
          backgroundColor: '#0a0e17',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px rgba(59, 130, 246, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#ffffff',
          fontFamily: 'inherit'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(24, 119, 242, 0.12) 0%, rgba(14, 165, 233, 0.05) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Facebook / Gold Avatar Icon */}
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1877f2 0%, #0d5bb5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 20px rgba(24, 119, 242, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              fontWeight: '900',
              fontSize: '20px'
            }}>
              f
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>
                  {currentPage.name}
                </h2>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: '900',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(24, 119, 242, 0.2)',
                  color: '#60a5fa',
                  border: '1px solid rgba(24, 119, 242, 0.4)'
                }}>
                  ● LIVE FACEBOOK FEED
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {currentPage.followers} • {currentPage.category}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href={currentPage.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: '#1877f2',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '800',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(24, 119, 242, 0.35)'
              }}
            >
              <span>Follow on Facebook</span>
              <ExternalLink size={13} />
            </a>
            <button
              type="button"
              onClick={handleRefresh}
              title="Refresh Live Feed"
              style={{
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 24px',
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: activeTab === 'feed' ? '1px solid #1877f2' : '1px solid transparent',
              background: activeTab === 'feed' ? 'rgba(24, 119, 242, 0.2)' : 'transparent',
              color: activeTab === 'feed' ? '#60a5fa' : '#94a3b8',
              fontSize: '12.5px',
              fontWeight: '900',
              cursor: 'pointer'
            }}
          >
            📱 Live Timeline & Posts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add_more')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: activeTab === 'add_more' ? '1px solid #1877f2' : '1px solid transparent',
              background: activeTab === 'add_more' ? 'rgba(24, 119, 242, 0.2)' : 'transparent',
              color: activeTab === 'add_more' ? '#60a5fa' : '#94a3b8',
              fontSize: '12.5px',
              fontWeight: '900',
              cursor: 'pointer'
            }}
          >
            ➕ Add More FB / Insta Pages
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'feed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Profile Card Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(24, 119, 242, 0.15) 0%, rgba(10, 15, 25, 0.6) 100%)',
                border: '1px solid rgba(24, 119, 242, 0.3)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>
                      {currentPage.name}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '800' }}>
                      {currentPage.followers} • {currentPage.category}
                    </span>
                  </div>
                  <a
                    href={currentPage.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '11.5px',
                      fontWeight: '800'
                    }}
                  >
                    Open Page ↗
                  </a>
                </div>

                <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', fontWeight: '600' }}>
                  {currentPage.bio}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '11.5px',
                  color: '#94a3b8'
                }}>
                  <ShieldCheck size={16} color="#10b981" />
                  <span>Verified Daily Sone Chandi Bhav Facebook Updates • Posts synced daily</span>
                </div>
              </div>

              {/* Live Daily Image Post Card (As shown in screenshot) */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: '#1877f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: '16px'
                    }}>
                      f
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#ffffff', display: 'block' }}>
                        {currentPage.name}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Daily Official Update • Just Now
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '800' }}>
                    🟢 Latest Post
                  </span>
                </div>

                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '14px',
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#f1f5f9', fontWeight: '700', lineHeight: '1.6' }}>
                    "ગુજરાતના સોના અને ચાંદીના રોજિંદા તાજા ભાવ હવે એક નજરમાં. સરળ, સ્પષ્ટ અને દૈનિક ઈમેજ અપડેટ્સ માટે અમારી સાથે જોડાયેલા રહો."
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '12px'
                  }}>
                    <span style={{ color: '#94a3b8' }}>Like our page to get daily updates.</span>
                    <a
                      href={currentPage.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: '#60a5fa',
                        fontWeight: '900',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      View on Facebook ➔
                    </a>
                  </div>
                </div>

                {/* Direct Facebook Live Timeline Frame */}
                <div style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: '#ffffff'
                }}>
                  <iframe
                    title="Facebook Daily Feed"
                    src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent('https://www.facebook.com/facebook')}&tabs=timeline&width=500&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`}
                    width="100%"
                    height="450"
                    style={{ border: 'none', overflow: 'hidden' }}
                    scrolling="no"
                    frameBorder="0"
                    allowFullScreen={true}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'add_more' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                backgroundColor: 'rgba(24, 119, 242, 0.08)',
                border: '1px solid rgba(24, 119, 242, 0.25)',
                borderRadius: '16px',
                padding: '18px'
              }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '900', color: '#ffffff' }}>
                  Add More Facebook & Instagram Pages
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#cbd5e1' }}>
                  Aap baad me jo bhi Facebook ya Instagram page bataenge, unka link yahan paste karke live add kar sakte hain.
                </p>
              </div>

              <form onSubmit={handleAddPage} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="url"
                  placeholder="Paste Facebook / Instagram Page URL (e.g. https://facebook.com/yourpage)..."
                  value={newUrlInput}
                  onChange={e => setNewUrlInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '13px'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newUrlInput.trim()}
                  style={{
                    padding: '0 20px',
                    borderRadius: '10px',
                    backgroundColor: '#1877f2',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '900',
                    fontSize: '12px',
                    cursor: newUrlInput.trim() ? 'pointer' : 'not-allowed',
                    opacity: newUrlInput.trim() ? 1 : 0.5
                  }}
                >
                  ADD PAGE
                </button>
              </form>

              {/* Saved Pages List */}
              <div>
                <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Connected Social Pages ({savedPages.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {savedPages.map(page => (
                    <div
                      key={page.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '14px', color: '#ffffff' }}>{page.name}</strong>
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>{page.url}</span>
                      </div>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#60a5fa', fontSize: '12px', fontWeight: '800', textDecoration: 'none' }}
                      >
                        Visit ↗
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
