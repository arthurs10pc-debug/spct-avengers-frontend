import React, { useState, useRef } from 'react';
import { X, CheckSquare, Mail, Pin, Paperclip, Image, Video, Music, FileText, Mic, Trash2, Download } from 'lucide-react';

export default function NotesModal({
  isOpen,
  onClose,
  userProfile,
  notesList,
  setNotesList,
  syncUserData,
  backendUrl,
  setActiveLightboxMedia
}) {
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState('#38bdf8');
  const [newNotePinned, setNewNotePinned] = useState(false);
  const [noteFilterTab, setNoteFilterTab] = useState('all');
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [notesTargetEmail, setNotesTargetEmail] = useState('');
  const [isSendingNotesEmail, setIsSendingNotesEmail] = useState(false);
  const [notesEmailFeedback, setNotesEmailFeedback] = useState('');
  const [stagedAttachments, setStagedAttachments] = useState([]);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const notesFileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  if (!isOpen) return null;

  const handleNotesFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      let type = 'file';
      if (file.type.startsWith('image/')) type = 'photo';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) type = 'pdf';

      reader.onload = (event) => {
        setStagedAttachments((prev) => [
          ...prev,
          {
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            name: file.name,
            type,
            size: file.size,
            dataUrl: event.target.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveStagedAttachment = (attId) => {
    setStagedAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleStartAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          setStagedAttachments((prev) => [
            ...prev,
            {
              id: 'att_' + Date.now(),
              name: `Voice_Note_${new Date().toLocaleTimeString('en-US', { hour12: false })}.webm`,
              type: 'audio',
              size: audioBlob.size,
              dataUrl: reader.result
            }
          ]);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecordingAudio(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone permission denied: " + err.message);
    }
  };

  const handleStopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const handleSaveNote = () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim() && stagedAttachments.length === 0) return;

    const newNote = {
      id: 'note_' + Date.now(),
      title: newNoteTitle.trim() || 'Untitled Note',
      content: newNoteContent.trim(),
      color: newNoteColor,
      pinned: newNotePinned,
      attachments: stagedAttachments,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const updated = [newNote, ...notesList];
    setNotesList(updated);
    if (syncUserData) syncUserData({ notes: updated });

    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNotePinned(false);
    setStagedAttachments([]);
  };

  const handleTogglePinNote = (noteId) => {
    const updated = notesList.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n));
    setNotesList(updated);
    if (syncUserData) syncUserData({ notes: updated });
  };

  const handleDeleteNote = (noteId) => {
    const updated = notesList.filter((n) => n.id !== noteId);
    setNotesList(updated);
    if (syncUserData) syncUserData({ notes: updated });
  };

  const handleSendNotesEmailNow = async (targetEmail) => {
    if (!targetEmail || !targetEmail.includes('@')) {
      alert("Please enter a valid target email address.");
      return;
    }
    setIsSendingNotesEmail(true);
    setNotesEmailFeedback('');
    try {
      const res = await fetch(`${backendUrl}/api/notes/email-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, notes: notesList })
      });
      const data = await res.json();
      if (data.success) {
        setNotesEmailFeedback('✅ Notes dispatched successfully to ' + targetEmail);
      } else {
        setNotesEmailFeedback('❌ ' + (data.error || 'Failed to dispatch email'));
      }
    } catch (e) {
      setNotesEmailFeedback('❌ Server network error: ' + e.message);
    } finally {
      setIsSendingNotesEmail(false);
      setTimeout(() => setNotesEmailFeedback(''), 5000);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.72)',
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        zIndex: 260,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        cursor: 'pointer'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-card notes-modal-card"
        style={{
          background: 'linear-gradient(150deg, rgba(18, 23, 35, 0.94) 0%, rgba(9, 12, 19, 0.98) 100%)',
          backdropFilter: 'blur(32px) saturate(190%)',
          WebkitBackdropFilter: 'blur(32px) saturate(190%)',
          borderRadius: '24px',
          padding: window.innerWidth < 640 ? '16px' : '24px',
          width: '100%',
          maxWidth: '780px',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.20)',
          color: '#FFFFFF',
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: 'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.55), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.08), 0 24px 60px rgba(0,0,0,0.75)',
          cursor: 'default'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            background: 'rgba(255, 255, 255, 0.12)',
            color: '#FFFFFF',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF', letterSpacing: '-0.3px' }}>
              <CheckSquare size={20} color="#38bdf8" /> Google Keep Style Notes
            </h3>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '800' }}>
              All notes and pinned notes synced across devices ({userProfile?.email || 'sataparahetkumar@gmail.com'})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="Target Gmail ID..."
              value={notesTargetEmail || (userProfile?.email || 'sataparahetkumar@gmail.com')}
              onChange={(e) => setNotesTargetEmail(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.20)',
                fontSize: '11px',
                width: '180px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                fontWeight: '800',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSendNotesEmailNow(notesTargetEmail || userProfile?.email || 'sataparahetkumar@gmail.com')}
              disabled={isSendingNotesEmail}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 243, 248, 0.85) 100%)',
                color: '#0b0f19',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '900',
                cursor: isSendingNotesEmail ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Mail size={13} />
              {isSendingNotesEmail ? 'Dispatching...' : '⚡ Test Multi-Channel Notes Dispatch'}
            </button>
          </div>
        </div>

        {/* Schedule Banner */}
        <div style={{ padding: '9px 14px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.07)', border: '1px solid rgba(255, 255, 255, 0.16)', color: 'rgba(255, 255, 255, 0.9)', fontSize: '11px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <span>⚡ 3x Daily Automated Delivery: <strong>08:00 AM</strong>, <strong>01:00 PM</strong>, <strong>08:30 PM IST</strong> auto-sent to your <strong>Telegram Bot (@shadow_assistant05_bot)</strong> &amp; <strong>Mobile Phone Push</strong>.</span>
          {notesEmailFeedback && (
            <span style={{ color: '#38bdf8', fontWeight: '900' }}>{notesEmailFeedback}</span>
          )}
        </div>

        {/* Note Creator */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.16)', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '900', color: '#FFFFFF' }}>
              ✍️ Create a Note
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255, 255, 255, 0.7)' }}>Color:</span>
              {['#38bdf8', '#f59e0b', '#10b981', '#f43f5e', '#a855f7', '#0284c7'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewNoteColor(c)}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: newNoteColor === c ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer'
                  }}
                />
              ))}
              <button
                type="button"
                onClick={() => setNewNotePinned(!newNotePinned)}
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  background: newNotePinned ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: newNotePinned ? '#fca5a5' : '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: '900'
                }}
              >
                <Pin size={13} fill={newNotePinned ? '#fca5a5' : 'none'} />
                <span>{newNotePinned ? 'Pinned' : 'Pin'}</span>
              </button>
            </div>
          </div>

          <input
            type="text"
            placeholder="Note Title..."
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.20)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              fontSize: '12px',
              fontWeight: '800',
              color: '#FFFFFF',
              marginBottom: '8px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />

          <textarea
            placeholder="Take a note, write details, or attach photos, videos, audios & PDFs..."
            rows={3}
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.20)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              fontSize: '12px',
              fontWeight: '700',
              color: '#FFFFFF',
              marginBottom: '10px',
              resize: 'vertical',
              boxSizing: 'border-box',
              lineHeight: '1.5',
              outline: 'none'
            }}
          />

          {/* Attachment Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <input
                type="file"
                ref={notesFileInputRef}
                multiple
                style={{ display: 'none' }}
                onChange={handleNotesFilesSelected}
              />
              <button
                type="button"
                onClick={() => {
                  if (notesFileInputRef.current) {
                    notesFileInputRef.current.accept = "image/*";
                    notesFileInputRef.current.click();
                  }
                }}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Image size={13} /> Photo
              </button>
              <button
                type="button"
                onClick={() => {
                  if (notesFileInputRef.current) {
                    notesFileInputRef.current.accept = "video/*";
                    notesFileInputRef.current.click();
                  }
                }}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Video size={13} /> Video
              </button>
              <button
                type="button"
                onClick={() => {
                  if (notesFileInputRef.current) {
                    notesFileInputRef.current.accept = "audio/*";
                    notesFileInputRef.current.click();
                  }
                }}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Music size={13} /> Audio
              </button>
              <button
                type="button"
                onClick={() => {
                  if (notesFileInputRef.current) {
                    notesFileInputRef.current.accept = "application/pdf,.pdf";
                    notesFileInputRef.current.click();
                  }
                }}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.20)', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <FileText size={13} /> PDF
              </button>
              <button
                type="button"
                onClick={isRecordingAudio ? handleStopAudioRecording : handleStartAudioRecording}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid ' + (isRecordingAudio ? '#ef4444' : 'rgba(255, 255, 255, 0.20)'),
                  backgroundColor: isRecordingAudio ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  color: isRecordingAudio ? '#fca5a5' : '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Mic size={13} color={isRecordingAudio ? '#fca5a5' : '#FFFFFF'} />
                {isRecordingAudio ? `Stop (${recordingDuration}s)` : 'Voice Record'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveNote}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 243, 248, 0.85) 100%)',
                color: '#0b0f19',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                padding: '8px 22px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              Save Note
            </button>
          </div>

          {/* Staged Attachments */}
          {stagedAttachments.length > 0 && (
            <div style={{ marginTop: '8px', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', border: '1px dashed rgba(255, 255, 255, 0.25)' }}>
              <div style={{ fontSize: '11px', fontWeight: '900', color: '#FFFFFF', marginBottom: '6px' }}>
                📎 Ready to Save ({stagedAttachments.length} Attachment{stagedAttachments.length > 1 ? 's' : ''}):
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {stagedAttachments.map((att) => (
                  <div
                    key={att.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      maxWidth: '220px'
                    }}
                  >
                    {att.type === 'photo' && <img src={att.dataUrl} alt={att.name} style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />}
                    {att.type === 'video' && <Video size={16} color="#60a5fa" />}
                    {att.type === 'audio' && <Music size={16} color="#4ade80" />}
                    {att.type === 'pdf' && <FileText size={16} color="#f87171" />}
                    <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {att.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStagedAttachment(att.id)}
                      style={{ border: 'none', background: 'transparent', color: '#f87171', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs & Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setNoteFilterTab('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.20)',
                backgroundColor: noteFilterTab === 'all' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                color: noteFilterTab === 'all' ? '#0b0f19' : '#FFFFFF',
                fontSize: '11px',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              All Notes ({notesList.length})
            </button>
            <button
              onClick={() => setNoteFilterTab('pinned')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.20)',
                backgroundColor: noteFilterTab === 'pinned' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                color: noteFilterTab === 'pinned' ? '#0b0f19' : '#FFFFFF',
                fontSize: '11px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Pin size={12} fill={noteFilterTab === 'pinned' ? '#0b0f19' : 'none'} />
              Pinned ({notesList.filter((n) => n.pinned).length})
            </button>
          </div>

          <input
            type="text"
            placeholder="Search notes..."
            value={noteSearchQuery}
            onChange={(e) => setNoteSearchQuery(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.20)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              fontSize: '11px',
              width: '180px',
              outline: 'none',
              fontWeight: '700'
            }}
          />
        </div>

        {/* Notes Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '12px' }}>
          {notesList
            .filter((n) => (noteFilterTab === 'pinned' ? !!n.pinned : true))
            .filter((n) => {
              if (!noteSearchQuery.trim()) return true;
              const q = noteSearchQuery.toLowerCase();
              return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q);
            })
            .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
            .map((note) => (
              <div
                key={note.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '14px',
                  padding: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  borderLeft: `5px solid ${note.color || '#38bdf8'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#FFFFFF', wordBreak: 'break-word', paddingRight: '8px' }}>
                      {note.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleTogglePinNote(note.id)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '3px', color: note.pinned ? '#f43f5e' : 'rgba(255, 255, 255, 0.4)' }}
                      >
                        <Pin size={14} fill={note.pinned ? '#f43f5e' : 'none'} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '3px', color: '#f87171' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {note.content && (
                    <p style={{ margin: '6px 0 10px 0', fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', whiteSpace: 'pre-wrap', lineHeight: '1.5', wordBreak: 'break-word' }}>
                      {note.content}
                    </p>
                  )}

                  {Array.isArray(note.attachments) && note.attachments.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                      {note.attachments.filter((a) => a.type === 'photo').length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: note.attachments.filter((a) => a.type === 'photo').length > 1 ? 'repeat(2, 1fr)' : '1fr', gap: '4px' }}>
                          {note.attachments.filter((a) => a.type === 'photo').map((att) => (
                            <div
                              key={att.id}
                              onClick={() => setActiveLightboxMedia && setActiveLightboxMedia(att)}
                              style={{ position: 'relative', cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', height: '110px' }}
                            >
                              <img src={att.dataUrl} alt={att.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      )}
                      {note.attachments.filter((a) => a.type === 'video').map((att) => (
                        <div key={att.id} style={{ borderRadius: '8px', overflow: 'hidden' }}>
                          <video src={att.dataUrl} controls style={{ width: '100%', maxHeight: '160px', display: 'block' }} />
                        </div>
                      ))}
                      {note.attachments.filter((a) => a.type === 'audio').map((att) => (
                        <div key={att.id} style={{ padding: '6px 8px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                          <audio src={att.dataUrl} controls style={{ width: '100%', height: '30px' }} />
                        </div>
                      ))}
                      {note.attachments.filter((a) => a.type === 'pdf').map((att) => (
                        <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: '800' }}>{att.name}</span>
                          <a href={att.dataUrl} download={att.name} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: '#dc2626', fontWeight: '900', textDecoration: 'none' }}>
                            <Download size={11} /> Open
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '8px', fontSize: '9px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '700' }}>
                  <span>{note.createdAt || 'Saved'}</span>
                  {note.pinned && (
                    <span style={{ color: '#e11d48', backgroundColor: '#ffe4e6', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>
                      📌 Pinned
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
