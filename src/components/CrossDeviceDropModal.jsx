import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, QrCode, Smartphone, Laptop, Upload, Download, Copy, Check, FileText, Image as ImageIcon, ArrowRight, Share2, Sparkles, RefreshCw, Send } from 'lucide-react';
import QRCode from 'qrcode';

// Audio chime using pure Web Audio API (Zero external file dependencies)
function playTransferChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Friendly two-tone ascending chime (D5 -> A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Non-critical if audio context is blocked
  }
}

export default function CrossDeviceDropModal({
  isOpen,
  onClose,
  socket,
  initialRoomId,
  onOpenInPhotoStudio
}) {
  const [roomId, setRoomId] = useState(() => {
    // If opened via URL query parameter, use that
    const urlParams = new URLSearchParams(window.location.search);
    const paramRoom = urlParams.get('dropRoom');
    if (paramRoom) return paramRoom.toUpperCase();
    return 'SHD-' + Math.floor(100 + Math.random() * 900);
  });

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [deviceCount, setDeviceCount] = useState(1);
  const [isCopied, setIsCopied] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [manualRoomInput, setManualRoomInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const currentDeviceType = isMobile ? 'mobile' : 'laptop';

  // Generate pairing URL
  const pairUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?dropRoom=${roomId}`
    : '';

  // Generate QR Code whenever roomId changes
  useEffect(() => {
    if (!roomId) return;
    QRCode.toDataURL(pairUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error("QR Code generation error:", err));
  }, [roomId, pairUrl]);

  // Join Socket Drop Room
  useEffect(() => {
    if (!socket || !isOpen || !roomId) return;

    socket.emit('join_drop_room', {
      roomId,
      deviceType: currentDeviceType,
      deviceName: isMobile ? 'Mobile Phone' : 'Laptop / PC'
    });

    const handleRoomStatus = (data) => {
      if (data.roomId === roomId) {
        setDeviceCount(data.deviceCount || 1);
      }
    };

    const handleReceivePayload = (payload) => {
      playTransferChime();
      setTransfers(prev => [payload, ...prev]);
    };

    socket.on('drop_room_status', handleRoomStatus);
    socket.on('drop_receive_payload', handleReceivePayload);

    return () => {
      socket.off('drop_room_status', handleRoomStatus);
      socket.off('drop_receive_payload', handleReceivePayload);
    };
  }, [socket, isOpen, roomId, currentDeviceType, isMobile]);

  // Send File or Image
  const sendFile = useCallback((file) => {
    if (!file || !socket) return;
    setIsSending(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      const payload = {
        roomId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: base64Data,
        senderDevice: isMobile ? 'Mobile Phone' : 'Laptop / PC',
        isImage: file.type.startsWith('image/')
      };

      socket.emit('drop_send_payload', payload);
      // Also add to local history as sent
      setTransfers(prev => [{
        ...payload,
        id: 'drop_self_' + Date.now(),
        timestamp: new Date().toISOString(),
        isSentByMe: true
      }, ...prev]);

      setIsSending(false);
    };
    reader.readAsDataURL(file);
  }, [socket, roomId, isMobile]);

  // Send Quick Text / Link Note
  const sendTextMessage = (e) => {
    e?.preventDefault();
    if (!textInput.trim() || !socket) return;

    const payload = {
      roomId,
      textNote: textInput.trim(),
      senderDevice: isMobile ? 'Mobile Phone' : 'Laptop / PC'
    };

    socket.emit('drop_send_payload', payload);
    setTransfers(prev => [{
      ...payload,
      id: 'drop_self_' + Date.now(),
      timestamp: new Date().toISOString(),
      isSentByMe: true
    }, ...prev]);

    setTextInput('');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGenerateNewRoom = () => {
    const newRoom = 'SHD-' + Math.floor(100 + Math.random() * 900);
    setRoomId(newRoom);
    setDeviceCount(1);
  };

  const handleJoinManualRoom = (e) => {
    e.preventDefault();
    if (!manualRoomInput.trim()) return;
    setRoomId(manualRoomInput.trim().toUpperCase());
    setManualRoomInput('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="drop-modal-overlay"
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
        className="drop-modal-container"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          backgroundColor: '#0a0e17',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px rgba(0, 245, 155, 0.15)',
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
          background: 'linear-gradient(135deg, rgba(0, 245, 155, 0.08) 0%, rgba(14, 165, 233, 0.05) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00f59b 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#042f1a',
              boxShadow: '0 0 20px rgba(0, 245, 155, 0.4)'
            }}>
              <Share2 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>
                  Instant QR Cross-Device Drop
                </h2>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: '900',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: deviceCount >= 2 ? 'rgba(0, 245, 155, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: deviceCount >= 2 ? '#00f59b' : '#f59e0b',
                  border: deviceCount >= 2 ? '1px solid rgba(0, 245, 155, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  {deviceCount >= 2 ? '🟢 PAIRED (2 DEVICES)' : '🟡 WAITING FOR PAIR'}
                </span>
              </div>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                Instant photo, screenshot, file & text transfer between Mobile & Laptop (No cable, no login)
              </span>
            </div>
          </div>

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

        {/* Modal Main Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Top Section: QR Code & Pairing Info */}
          <div 
            className="drop-pairing-top-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '18px',
              alignItems: 'center'
            }}
          >
            {/* QR Card */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#ffffff',
              padding: '14px',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Pairing QR Code"
                  style={{ width: '170px', height: '170px', display: 'block', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ width: '170px', height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000' }}>
                  Generating QR...
                </div>
              )}
              <span style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', textAlign: 'center' }}>
                Scan with Phone Camera 📲
              </span>
            </div>

            {/* Room ID & Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>
                  ACTIVE PAIRING CODE:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '900',
                    letterSpacing: '2px',
                    color: '#00f59b',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(0, 245, 155, 0.1)',
                    border: '1px solid rgba(0, 245, 155, 0.3)'
                  }}>
                    {roomId}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    {isCopied ? <Check size={14} color="#00f59b" /> : <Copy size={14} />}
                    {isCopied ? 'COPIED!' : 'COPY LINK'}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateNewRoom}
                    title="Generate New Pairing Code"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Status pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: deviceCount >= 2 ? 'rgba(0, 245, 155, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: deviceCount >= 2 ? '1px solid rgba(0, 245, 155, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                {isMobile ? <Smartphone size={18} color={deviceCount >= 2 ? "#00f59b" : "#f59e0b"} /> : <Laptop size={18} color={deviceCount >= 2 ? "#00f59b" : "#f59e0b"} />}
                <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: '700' }}>
                  {deviceCount >= 2 
                    ? '🎉 Paired! Any file or photo you drop below will appear instantly on the other screen with sound.'
                    : 'Open this website on your mobile/laptop and enter code or scan QR above to link both devices.'}
                </span>
              </div>

              {/* Enter Room Manually */}
              <form onSubmit={handleJoinManualRoom} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Join other Room (e.g. SHD-123)"
                  value={manualRoomInput}
                  onChange={e => setManualRoomInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '12px'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#00f59b',
                    color: '#042f1a',
                    border: 'none',
                    fontWeight: '900',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  JOIN
                </button>
              </form>
            </div>
          </div>

          {/* Middle Section: Drag & Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                sendFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: isDragging ? '2px dashed #00f59b' : '2px dashed rgba(255, 255, 255, 0.2)',
              backgroundColor: isDragging ? 'rgba(0, 245, 155, 0.1)' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              padding: '28px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s ease'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  sendFile(e.target.files[0]);
                }
              }}
            />
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 245, 155, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f59b'
            }}>
              <Upload size={24} />
            </div>
            <div>
              <strong style={{ fontSize: '15px', color: '#ffffff', display: 'block' }}>
                {isSending ? 'Sending file to paired device...' : 'Drop Any Photo, Screenshot or File Here'}
              </strong>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Supports JPG, PNG, WEBP, PDF, DOCX, ZIP • Tap to browse files from this device
              </span>
            </div>
          </div>

          {/* Quick Note / Link Sender */}
          <form onSubmit={sendTextMessage} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Or type a quick note, URL, or clipboard text to send instantly..."
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
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
              disabled={!textInput.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 20px',
                borderRadius: '10px',
                backgroundColor: '#00f59b',
                color: '#042f1a',
                border: 'none',
                fontWeight: '900',
                fontSize: '12px',
                cursor: textInput.trim() ? 'pointer' : 'not-allowed',
                opacity: textInput.trim() ? 1 : 0.5,
                textTransform: 'uppercase'
              }}
            >
              <Send size={14} />
              <span>SEND</span>
            </button>
          </form>

          {/* Bottom Section: Transferred Items History */}
          {transfers.length > 0 && (
            <div>
              <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                SESSION TRANSFERS ({transfers.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {transfers.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      background: item.isSentByMe 
                        ? 'rgba(255, 255, 255, 0.03)' 
                        : 'linear-gradient(135deg, rgba(0, 245, 155, 0.1) 0%, rgba(14, 165, 233, 0.05) 100%)',
                      border: item.isSentByMe ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 245, 155, 0.3)',
                      borderRadius: '14px',
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.isImage && item.fileData ? (
                        <img
                          src={item.fileData}
                          alt="Transfer thumbnail"
                          style={{
                            width: '48px',
                            height: '48px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#00f59b'
                        }}>
                          {item.textNote ? <FileText size={20} /> : <ImageIcon size={20} />}
                        </div>
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '13px', color: '#ffffff' }}>
                            {item.fileName || 'Quick Text Note'}
                          </strong>
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: '800',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            color: '#94a3b8'
                          }}>
                            {item.isSentByMe ? 'SENT BY YOU' : `FROM ${item.senderDevice?.toUpperCase() || 'DEVICE'}`}
                          </span>
                        </div>
                        {item.textNote && (
                          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#e2e8f0', wordBreak: 'break-all' }}>
                            {item.textNote}
                          </p>
                        )}
                        {item.fileSize && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {(item.fileSize / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {item.isImage && onOpenInPhotoStudio && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenInPhotoStudio(item.fileData);
                            onClose();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(168, 85, 247, 0.2)',
                            color: '#c084fc',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          <Sparkles size={12} />
                          <span>OPEN IN PHOTO STUDIO</span>
                        </button>
                      )}

                      {item.fileData && (
                        <a
                          href={item.fileData}
                          download={item.fileName || 'drop_transfer'}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#00f59b',
                            color: '#042f1a',
                            fontSize: '11px',
                            fontWeight: '900',
                            textDecoration: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <Download size={12} />
                          <span>DOWNLOAD</span>
                        </a>
                      )}

                      {item.textNote && (
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(item.textNote)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          <Copy size={12} />
                          <span>COPY</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
