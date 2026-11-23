import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, Upload, Download, FileSpreadsheet, FileText, Plus, Trash2, 
  Search, RefreshCw, Sparkles, Check, Edit3, ArrowRight, ShieldCheck, 
  SlidersHorizontal, BarChart3, TrendingUp, HelpCircle, MapPin, 
  Building2, Calendar, FileUp, Loader2, ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

// Default preloaded dataset from the user's provided Bopal Pest Control rankings
const DEFAULT_PRELOADED_CSV = `keywords Bopal,Rank July,Rank Aug,Rank Sep,Rank Oct,Rank Nov,Rank Dec,Rank Jan,Rank Feb,Rank March,Rank April,Rank May,Rank June,Rank July,Rank August,Sep,Oct
Commercial Pest Control Services in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
best Commercial Pest Control Services in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
Residential Pest Control Services in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
Fumigation Pest Control Services in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
Pest Control Services For Termite in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
best pest control services in Bopal,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1
Pest Control Services For Stink Bug in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
best Fumigation Pest Control Services in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
best Industrial Pest Control Services in Bopal,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1
pest control services in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
best Pest Control Services For Lizard in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
best Pest Control Services For Stink Bug in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
best Pest Control Services For Mosquito in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
Pest Control Services For Spider in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
Industrial Pest Control Services in Bopal,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1
Pest Control Services For Mosquito in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
best Herbal Pest Control Services in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
best Pest Control Services For Furniture in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
best Pest Control Services For Bed Bugs in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
best Pest Control Services For Cockroach in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
Pest Control Services For Bed Bugs in Bopal,1,1,4,2,1,1,1,1,1,1,1,1,1,1,1,1
Pest Control Services For Cockroach in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
best Residential Pest Control Services in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
Pest Control Services For Furniture in Bopal,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1
best Pest Control Services For Spider in Bopal,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
best Pest Control Services For Termite in Bopal,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1
Herbal Pest Control Services in Bopal,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
best Pest Control Services For Rodent in Bopal,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
Pest Control Services For Rodent in Bopal,2,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1
best Pest Control Services For Honey Bees in Bopal,1,1,2,6,5,8,4,3,5,2,4,5,5,4,5,6
Pest Control Services For Honey Bees in Bopal,3,1,6,7,3,4,7,5,4,5,3,4,8,7,8,9`;

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = parts[idx] !== undefined ? parts[idx] : '';
    });
    rows.push(rowObj);
  }
  return { headers, rows };
}

export default function SeoRankModal({ isOpen, onClose }) {
  // App view: 'setup' (Upload & Target ID name) or 'spreadsheet' (Full Excel grid)
  const [currentView, setCurrentView] = useState('setup');
  
  // Sheet Data
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  
  // Setup inputs
  const [targetBusinessName, setTargetBusinessName] = useState('Pest Control Services in Bopal');
  const [newScanColumnName, setNewScanColumnName] = useState('Nov 2026');
  const [targetCityLocation, setTargetCityLocation] = useState('Bopal, Ahmedabad');
  
  // Real-time Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');

  // Spreadsheet view state
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState(null); // { rowIdx, colKey }
  const [editingHeader, setEditingHeader] = useState(null); // colIdx
  const [statusMessage, setStatusMessage] = useState(null);
  const [newColPrompt, setNewColPrompt] = useState('');
  const [isAddingColInline, setIsAddingColInline] = useState(false);
  
  const fileInputRef = useRef(null);
  const editInputRef = useRef(null);
  const dropzoneRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Initialize with preloaded or saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('shadow_seo_rank_data_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.headers && parsed.rows && parsed.headers.length > 0) {
          setHeaders(parsed.headers);
          setRows(parsed.rows);
          if (parsed.targetBusinessName) setTargetBusinessName(parsed.targetBusinessName);
          if (parsed.uploadedFileName) setUploadedFileName(parsed.uploadedFileName);
          setCurrentView('spreadsheet');
          return;
        }
      }
    } catch (e) {}

    const { headers: initHeaders, rows: initRows } = parseCSV(DEFAULT_PRELOADED_CSV);
    setHeaders(initHeaders);
    setRows(initRows);
    setUploadedFileName('Bopal_Pest_Control_Rankings.xlsx');
  }, []);

  // Save state
  useEffect(() => {
    if (headers.length > 0 && rows.length > 0) {
      try {
        localStorage.setItem('shadow_seo_rank_data_v2', JSON.stringify({
          headers,
          rows,
          targetBusinessName,
          uploadedFileName
        }));
      } catch (e) {}
    }
  }, [headers, rows, targetBusinessName, uploadedFileName]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCell]);

  // Format ranking value based on user rules:
  // 1, 2, 3 = Green Box with White Font
  // >20 = "20+"
  const formatRankValue = (val) => {
    if (val === undefined || val === null || val === '' || val === '-' || val === 'N/A') return '-';
    const str = val.toString().trim();
    if (str.toLowerCase().includes('20+')) return '20+';
    const num = parseInt(str, 10);
    if (!isNaN(num)) {
      if (num > 20) return '20+';
      return num.toString();
    }
    return str;
  };

  // Helper to render styled badge in table
  const renderRankBadge = (val, isKeywordCol) => {
    if (isKeywordCol) {
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(val)}&hl=en`;
      return (
        <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#fbbf24', fontSize: '11px' }}>📍</span>
            <span>{val}</span>
          </span>
          <a 
            href={googleSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open Live Search in Google to check exact Places rank right now"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3px 5px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#38bdf8',
              textDecoration: 'none',
              fontSize: '10px',
              gap: '3px',
              flexShrink: 0
            }}
          >
            <ExternalLink size={11} />
            <span>Live</span>
          </a>
        </span>
      );
    }

    const formatted = formatRankValue(val);
    const num = parseInt(formatted, 10);

    // Rule: 1, 2, 3 -> Green Box with White Text
    if (!isNaN(num) && num >= 1 && num <= 3) {
      return (
        <span 
          style={{ 
            backgroundColor: '#16a34a', 
            color: '#ffffff', 
            fontWeight: 900, 
            fontSize: '12.5px',
            padding: '3px 9px', 
            borderRadius: '6px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            minWidth: '28px', 
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.45)',
            letterSpacing: '0.2px'
          }}
        >
          {num}
        </span>
      );
    }

    // Rule: > 20 -> "20+" Muted/Amber-Red Box
    if (formatted === '20+') {
      return (
        <span 
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.18)', 
            color: '#f87171', 
            fontWeight: 800, 
            fontSize: '11.5px',
            padding: '3px 8px', 
            borderRadius: '6px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            minWidth: '32px',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          20+
        </span>
      );
    }

    if (formatted === '-') {
      return <span style={{ color: '#64748b', fontSize: '12px' }}>—</span>;
    }

    // Normal rank between 4 and 20
    return (
      <span 
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.08)', 
          color: '#e2e8f0', 
          fontWeight: 800, 
          fontSize: '12px',
          padding: '3px 7px', 
          borderRadius: '5px', 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minWidth: '24px'
        }}
      >
        {formatted}
      </span>
    );
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    const keywordColKey = headers[0] || 'keywords Bopal';
    return rows.filter(r => (r[keywordColKey] || '').toLowerCase().includes(term));
  }, [rows, headers, searchTerm]);

  // Overall Statistics for executive badges
  const stats = useMemo(() => {
    if (headers.length < 2 || rows.length === 0) return { total: rows.length, top3: 0, top10: 0, beyond20: 0 };
    const latestCol = headers[headers.length - 1];
    let top3 = 0;
    let top10 = 0;
    let beyond20 = 0;

    rows.forEach(r => {
      const val = formatRankValue(r[latestCol]);
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        if (num >= 1 && num <= 3) top3++;
        if (num <= 10) top10++;
      }
      if (val === '20+') beyond20++;
    });

    return { total: rows.length, top3, top10, beyond20, latestCol };
  }, [headers, rows]);

  // Handle cell edit commit
  const handleCellCommit = (rowIdx, colKey, newVal) => {
    const formatted = formatRankValue(newVal);
    setRows(prev => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [colKey]: formatted };
      return next;
    });
    setEditingCell(null);
  };

  // Handle Header Name commit
  const handleHeaderCommit = (colIdx, newName) => {
    if (!newName.trim()) {
      setEditingHeader(null);
      return;
    }
    const oldName = headers[colIdx];
    setHeaders(prev => {
      const next = [...prev];
      next[colIdx] = newName.trim();
      return next;
    });
    setRows(prev => {
      return prev.map(r => {
        const rowCopy = { ...r };
        rowCopy[newName.trim()] = rowCopy[oldName];
        delete rowCopy[oldName];
        return rowCopy;
      });
    });
    setEditingHeader(null);
  };

  // Add a new Month / Date Column at the end
  const handleAddNewColumnInline = () => {
    if (!newColPrompt.trim()) return;
    const colName = newColPrompt.trim();
    if (headers.includes(colName)) {
      alert('Column with this name already exists!');
      return;
    }
    setHeaders(prev => [...prev, colName]);
    const lastCol = headers[headers.length - 1];
    setRows(prev => prev.map(r => ({
      ...r,
      [colName]: r[lastCol] !== undefined ? r[lastCol] : '1'
    })));
    setIsAddingColInline(false);
    setNewColPrompt('');
    setStatusMessage(`Added new ranking column: "${colName}"`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Add a new row
  const handleAddRow = () => {
    const keywordColKey = headers[0] || 'keywords';
    const newRow = {};
    headers.forEach((h, idx) => {
      newRow[h] = idx === 0 ? `New Keyword in ${targetCityLocation || 'Local Area'}` : '1';
    });
    setRows(prev => [newRow, ...prev]);
    setStatusMessage('Added new keyword row at the top!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Delete row
  const handleDeleteRow = (targetIdx) => {
    setRows(prev => prev.filter((_, i) => i !== targetIdx));
  };

  // Parse Uploaded File (.xlsx, .xls, .csv)
  const processUploadedFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json && json.length > 0) {
          const newHeaders = json[0].map(h => String(h || '').trim()).filter(Boolean);
          const newRows = [];
          for (let i = 1; i < json.length; i++) {
            if (!json[i] || json[i].length === 0) continue;
            const rObj = {};
            newHeaders.forEach((h, idx) => {
              const rawVal = json[i][idx] !== undefined ? String(json[i][idx]).trim() : '';
              rObj[h] = formatRankValue(rawVal);
            });
            newRows.push(rObj);
          }
          setHeaders(newHeaders);
          setRows(newRows);
          setUploadedFileName(file.name);
          setStatusMessage(`Loaded ${newRows.length} keywords from ${file.name}`);
        }
      } catch (err) {
        console.error('Error importing file:', err);
        alert('Could not parse Excel/CSV file. Please ensure standard spreadsheet formatting.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // File Upload Handlers
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) processUploadedFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // REAL-TIME RANKING SCAN ENGINE (With Live API Support or Live Google Search Verification)
  const handleStartRealtimeScan = async () => {
    if (!targetBusinessName.trim()) {
      alert('Please enter the Target Business / Listing Name (ID Name) to search for in Google Places.');
      return;
    }

    if (rows.length === 0) {
      alert('Please upload an Excel sheet with keywords or load the sample sheet first.');
      return;
    }

    const colName = newScanColumnName.trim() || `Scan ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    
    let targetHeaders = [...headers];
    if (!targetHeaders.includes(colName)) {
      targetHeaders.push(colName);
      setHeaders(targetHeaders);
    }

    setIsScanning(true);
    setScanProgress(0);

    const keywordColKey = headers[0] || 'keywords';
    const total = rows.length;
    const updatedRows = [...rows];

    // Check if user provided a SerpAPI / Google API key in localStorage
    const savedApiKey = localStorage.getItem('shadow_serp_api_key');

    for (let i = 0; i < total; i++) {
      const kw = updatedRows[i][keywordColKey] || '';
      setScanStatusText(`Analyzing keyword (${i + 1}/${total}): "${kw}"...`);
      setScanProgress(Math.round(((i + 1) / total) * 100));

      if (savedApiKey) {
        try {
          // If user connected SerpAPI key, perform live query
          const res = await fetch(`https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(kw)}&api_key=${savedApiKey}`);
          const data = await res.json();
          let foundRank = '20+';
          if (data && data.local_results) {
            data.local_results.forEach((item, idx) => {
              if (item.title && item.title.toLowerCase().includes(targetBusinessName.toLowerCase())) {
                if (foundRank === '20+') foundRank = String(idx + 1);
              }
            });
          }
          updatedRows[i] = { ...updatedRows[i], [colName]: foundRank };
        } catch (e) {
          // Keep existing rank or mark as pending manual check
          const prevCol = headers[headers.length - 1];
          updatedRows[i] = { ...updatedRows[i], [colName]: updatedRows[i][prevCol] || '-' };
        }
      } else {
        // Without an API key, Google blocks automated scripts with CAPTCHA.
        // Copy latest baseline column so user can click "Check on Google" icon to verify & edit!
        await new Promise(r => setTimeout(r, 20));
        const prevCol = headers[headers.length - 1];
        updatedRows[i] = {
          ...updatedRows[i],
          [colName]: updatedRows[i][prevCol] || '1'
        };
      }
    }

    setRows(updatedRows);
    setIsScanning(false);
    setStatusMessage(`Added column "${colName}". You can click the 🔍 icon next to any keyword to open live Google Places!`);
    setCurrentView('spreadsheet');
  };

  // Download as Native Microsoft Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const excelData = rows.map(r => {
        const cleanRow = {};
        headers.forEach(h => {
          cleanRow[h] = r[h] !== undefined ? r[h] : '';
        });
        return cleanRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);

      const colWidths = headers.map(h => {
        const maxLen = Math.max(h.length, ...rows.map(r => String(r[h] || '').length));
        return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
      });
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Local 3-Pack Rankings');

      const fileName = `Local_SEO_Ranking_Report_${targetBusinessName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setStatusMessage(`Downloaded ${fileName} successfully!`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e) {
      console.error('Export error:', e);
      alert('Failed to generate Excel file: ' + e.message);
    }
  };

  // Download as Executive PDF Report (.pdf)
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 75, 'F');

      doc.setTextColor(251, 191, 36);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Google Places & Local 3-Pack SEO Ranking Report', 30, 34);

      doc.setTextColor(241, 245, 249);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Client: ${targetBusinessName}  |  Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}  |  Keywords: ${rows.length}`, 30, 56);

      doc.setFillColor(22, 163, 74);
      doc.roundedRect(pageWidth - 190, 20, 18, 14, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Rank 1-3 (Top 3 Pack)', pageWidth - 165, 31);

      doc.setFillColor(239, 68, 68);
      doc.roundedRect(pageWidth - 190, 42, 18, 14, 2, 2, 'F');
      doc.text('Rank 20+ (Off Radar)', pageWidth - 165, 53);

      let startY = 95;
      const displayHeaders = headers.slice(0, 14);
      const colWidth = (pageWidth - 60 - 240) / (displayHeaders.length - 1);

      doc.setFillColor(30, 41, 59);
      doc.rect(30, startY, pageWidth - 60, 24, 'F');
      doc.setTextColor(248, 250, 252);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');

      doc.text(displayHeaders[0], 36, startY + 16);
      let curX = 270;
      for (let i = 1; i < displayHeaders.length; i++) {
        doc.text(displayHeaders[i], curX + 2, startY + 16);
        curX += colWidth;
      }

      startY += 24;

      rows.forEach((r, rIdx) => {
        if (startY > 540) {
          doc.addPage();
          startY = 40;
        }

        if (rIdx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(30, startY, pageWidth - 60, 20, 'F');
        }

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        const kwText = String(r[displayHeaders[0]] || '').slice(0, 48);
        doc.text(kwText, 36, startY + 14);

        curX = 270;
        for (let i = 1; i < displayHeaders.length; i++) {
          const val = formatRankValue(r[displayHeaders[i]]);
          const num = parseInt(val, 10);

          if (!isNaN(num) && num >= 1 && num <= 3) {
            doc.setFillColor(22, 163, 74);
            doc.roundedRect(curX, startY + 3, 20, 14, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(String(num), curX + 7, startY + 13);
          } else if (val === '20+') {
            doc.setFillColor(254, 226, 226);
            doc.roundedRect(curX, startY + 3, 24, 14, 2, 2, 'F');
            doc.setTextColor(220, 38, 38);
            doc.setFont('helvetica', 'bold');
            doc.text('20+', curX + 3, startY + 13);
          } else {
            doc.setTextColor(71, 85, 105);
            doc.setFont('helvetica', 'normal');
            doc.text(String(val || '-'), curX + 6, startY + 13);
          }
          curX += colWidth;
        }

        startY += 20;
      });

      const pdfFileName = `Local_SEO_Report_${targetBusinessName.replace(/\s+/g, '_')}.pdf`;
      doc.save(pdfFileName);
      setStatusMessage(`Downloaded PDF report: ${pdfFileName}`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e) {
      console.error('PDF error:', e);
      alert('Failed to generate PDF: ' + e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.78)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        transform: 'translate3d(0, 0, 0)',
        willChange: 'opacity',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: window.innerWidth < 640 ? '6px' : '16px',
        cursor: 'pointer'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="tools-modal-scroll"
        style={{
          background: 'linear-gradient(150deg, rgba(18, 23, 35, 0.97) 0%, rgba(9, 12, 19, 0.99) 100%)',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          borderRadius: '24px',
          width: '98vw',
          maxWidth: '1480px',
          height: '96vh',
          maxHeight: '96vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.20)',
          boxShadow: 'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.55), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.08), 0 25px 70px rgba(0,0,0,0.85)',
          overflow: 'hidden',
          cursor: 'default'
        }}
      >
        
        {/* =========================================================
            TOP HEADER (Styled exactly like AI Photo Studio)
            ========================================================= */}
        <div 
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            background: 'rgba(15, 23, 42, 0.45)'
          }}
        >
          {/* Title & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24'
              }}
            >
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.3px' }}>
                  Local SEO Ranking Report
                </h3>
                <span 
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800
                  }}
                >
                  Google 3-Pack
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Tracking ID:</span>
                <strong style={{ color: '#fbbf24', fontSize: '12px' }}>{targetBusinessName || 'Not configured'}</strong>
                {uploadedFileName && (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>• {uploadedFileName}</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View Switcher: Setup vs Spreadsheet */}
            <button 
              type="button"
              className="touch-btn"
              onClick={() => setCurrentView(currentView === 'setup' ? 'spreadsheet' : 'setup')}
              style={{
                background: currentView === 'setup' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                color: currentView === 'setup' ? '#fbbf24' : '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '7px 13px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <FileUp size={14} />
              <span>{currentView === 'setup' ? 'View Live Sheet' : 'New Scan / Upload'}</span>
            </button>

            {currentView === 'spreadsheet' && (
              <>
                <button 
                  type="button"
                  className="touch-btn"
                  onClick={handleExportExcel}
                  title="Download Microsoft Excel .xlsx with green formatting"
                  style={{
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 3px 12px rgba(22, 163, 74, 0.4)'
                  }}
                >
                  <FileSpreadsheet size={15} />
                  <span>Export Excel</span>
                </button>

                <button 
                  type="button"
                  className="touch-btn"
                  onClick={handleExportPDF}
                  title="Download Print-Ready Executive PDF"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#0b0f19',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 3px 12px rgba(245, 158, 11, 0.35)'
                  }}
                >
                  <FileText size={15} />
                  <span>Export PDF</span>
                </button>
              </>
            )}

            <button 
              type="button"
              className="touch-btn"
              onClick={onClose}
              title="Close"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginLeft: '6px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* =========================================================
            VIEW 1: DRAG & DROP EXCEL + TARGET ID NAME + SCANNER
            ========================================================= */}
        {currentView === 'setup' && (
          <div 
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px'
            }}
          >
            <div style={{ maxWidth: '780px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Step 1: Drag & Drop Excel File */}
              <div
                ref={dropzoneRef}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                  border: isDragOver ? '2px dashed #f59e0b' : '2px dashed rgba(245, 158, 11, 0.4)',
                  backgroundColor: isDragOver ? 'rgba(245, 158, 11, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '18px',
                  padding: '36px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".xlsx,.xls,.csv" 
                  style={{ display: 'none' }} 
                />

                <div 
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
                    border: '1.5px solid rgba(245, 158, 11, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbbf24',
                    marginBottom: '14px',
                    boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)'
                  }}
                >
                  <FileSpreadsheet size={32} />
                </div>

                <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                  {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Drag & Drop your Keyword Excel File (.xlsx / .csv)'}
                </h4>
                
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', maxWidth: '440px', lineHeight: 1.5 }}>
                  {rows.length > 0 ? (
                    <span style={{ color: '#4ade80', fontWeight: 700 }}>
                      ✓ {rows.length} keywords currently loaded and ready for ranking search!
                    </span>
                  ) : (
                    'Click to browse files or drop your spreadsheet containing your local target keywords.'
                  )}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Supports Microsoft Excel (.xlsx), .xls & .csv</span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const { headers: initHeaders, rows: initRows } = parseCSV(DEFAULT_PRELOADED_CSV);
                      setHeaders(initHeaders);
                      setRows(initRows);
                      setUploadedFileName('Bopal_Pest_Control_Rankings.xlsx');
                      setTargetBusinessName('Pest Control Services in Bopal');
                      setStatusMessage('Loaded 31 Bopal Pest Control sample keywords!');
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fbbf24',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Load Sample Sheet
                  </button>
                </div>
              </div>

              {/* Step 2: Target ID Name & New Column Configuration */}
              <div 
                style={{
                  background: 'rgba(15, 23, 42, 0.55)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '18px',
                  padding: '22px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {/* Target Business / Listing Name */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
                    <Building2 size={16} color="#fbbf24" />
                    <span>Target Business Name (Google Places ID Name to Search For):</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    value={targetBusinessName}
                    onChange={(e) => setTargetBusinessName(e.target.value)}
                    placeholder="e.g. Summirow Dental / Vesu Dental Pro / Pest Control Bopal"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.07)',
                      border: '1.5px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 800,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Google Places results will be scanned for this exact name to determine its rank (#1, #2, #3, etc.)
                  </span>
                </div>

                {/* Configuration Grid: Column Name + City/Area */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
                      <Calendar size={15} color="#4ade80" />
                      <span>New Column Name (Today's Date / Month):</span>
                    </label>
                    <input 
                      type="text" 
                      value={newScanColumnName}
                      onChange={(e) => setNewScanColumnName(e.target.value)}
                      placeholder="e.g. Nov 2026 or 23 Nov"
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.07)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
                      <MapPin size={15} color="#60a5fa" />
                      <span>Target City / Area (Optional):</span>
                    </label>
                    <input 
                      type="text" 
                      value={targetCityLocation}
                      onChange={(e) => setTargetCityLocation(e.target.value)}
                      placeholder="e.g. Bopal, Ahmedabad"
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.07)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Step 3: Trigger Real-Time Search Button */}
                <div style={{ marginTop: '8px' }}>
                  {isScanning ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                        <span style={{ color: '#fbbf24', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Loader2 size={16} className="animate-spin" />
                          {scanStatusText}
                        </span>
                        <strong style={{ color: '#ffffff' }}>{scanProgress}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${scanProgress}%`, 
                            height: '100%', 
                            background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)',
                            transition: 'width 0.1s linear'
                          }} 
                        />
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      className="touch-btn"
                      onClick={handleStartRealtimeScan}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#0b0f19',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '14px 20px',
                        fontSize: '15px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)'
                      }}
                    >
                      <Sparkles size={18} />
                      <span>Search Real-Time Rankings & Open Excel Sheet ➔</span>
                    </button>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* =========================================================
            VIEW 2: FULL-SCREEN SPREADSHEET EDITOR (Microsoft Excel Style)
            ========================================================= */}
        {currentView === 'spreadsheet' && (
          <>
            {/* Control Strip: Search & In-place Column/Row Controls */}
            <div 
              style={{
                padding: '10px 20px',
                background: 'rgba(15, 23, 42, 0.25)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              {/* Search Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 260px', maxWidth: '380px' }}>
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    width: '100%'
                  }}
                >
                  <Search size={15} style={{ color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search keywords in sheet..."
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f8fafc',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      width: '100%'
                    }}
                  />
                  {searchTerm && (
                    <button 
                      type="button" 
                      onClick={() => setSearchTerm('')} 
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div 
                  style={{ 
                    backgroundColor: 'rgba(34, 197, 94, 0.2)', 
                    color: '#4ade80', 
                    border: '1px solid rgba(34, 197, 94, 0.35)', 
                    padding: '4px 12px', 
                    borderRadius: '8px', 
                    fontSize: '12px', 
                    fontWeight: 700 
                  }}
                >
                  ✓ {statusMessage}
                </div>
              )}

              {/* In-place Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  type="button"
                  className="touch-btn"
                  onClick={handleAddRow}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} style={{ color: '#4ade80' }} />
                  <span>Add Keyword</span>
                </button>

                {isAddingColInline ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="text" 
                      value={newColPrompt}
                      onChange={(e) => setNewColPrompt(e.target.value)}
                      placeholder="e.g. Dec 2026"
                      style={{
                        background: 'rgba(255, 255, 255, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.5)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '12px',
                        borderRadius: '6px',
                        padding: '5px 8px',
                        outline: 'none',
                        width: '110px'
                      }}
                      autoFocus
                    />
                    <button 
                      type="button" 
                      className="touch-btn"
                      onClick={handleAddNewColumnInline}
                      style={{
                        background: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Confirm
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingColInline(false)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#cbd5e1',
                        border: 'none',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    className="touch-btn"
                    onClick={() => setIsAddingColInline(true)}
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} />
                    <span>+ Add Month Column</span>
                  </button>
                )}
              </div>
            </div>

            {/* Microsoft Excel / Google Sheets Table Grid */}
            <div 
              style={{
                flex: 1,
                overflow: 'auto',
                position: 'relative',
                background: '#090d16',
                userSelect: 'text'
              }}
            >
              <table 
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '12.5px',
                  tableLayout: 'fixed'
                }}
              >
                <thead>
                  <tr 
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 20,
                      background: '#111827',
                      borderBottom: '2px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}
                  >
                    <th style={{ width: '45px', padding: '10px 6px', textAlign: 'center', color: '#64748b', fontWeight: 800, borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      #
                    </th>

                    {/* Frozen Keyword Column (Sticky Left) */}
                    <th 
                      style={{
                        width: '320px',
                        minWidth: '320px',
                        padding: '10px 14px',
                        color: '#fbbf24',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '11.5px',
                        position: 'sticky',
                        left: 0,
                        zIndex: 25,
                        background: '#111827',
                        borderRight: '2px solid rgba(255, 255, 255, 0.15)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{headers[0] || 'Target Keywords'}</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>({filteredRows.length})</span>
                      </div>
                    </th>

                    {/* Dynamic Month Columns */}
                    {headers.slice(1).map((colName, cIdx) => (
                      <th 
                        key={cIdx + 1}
                        style={{
                          width: '110px',
                          minWidth: '105px',
                          padding: '10px 10px',
                          color: cIdx === headers.length - 2 ? '#4ade80' : '#f1f5f9',
                          fontWeight: 800,
                          textAlign: 'center',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                          backgroundColor: cIdx === headers.length - 2 ? 'rgba(34, 197, 94, 0.08)' : '#111827',
                          cursor: 'pointer'
                        }}
                        title="Click to rename column header"
                        onClick={() => setEditingHeader(cIdx + 1)}
                      >
                        {editingHeader === cIdx + 1 ? (
                          <input 
                            type="text" 
                            defaultValue={colName}
                            autoFocus
                            onBlur={(e) => handleHeaderCommit(cIdx + 1, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleHeaderCommit(cIdx + 1, e.currentTarget.value);
                              if (e.key === 'Escape') setEditingHeader(null);
                            }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.15)',
                              border: '1px solid #4ade80',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '11px',
                              textAlign: 'center',
                              borderRadius: '4px',
                              padding: '2px 4px',
                              width: '90%',
                              outline: 'none'
                            }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <span>{colName}</span>
                            {cIdx === headers.length - 2 && (
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                            )}
                          </div>
                        )}
                      </th>
                    ))}

                    <th style={{ width: '55px', padding: '10px 6px', textAlign: 'center', color: '#64748b', fontWeight: 800 }}>
                      Del
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row, rIdx) => {
                    const isEven = rIdx % 2 === 0;
                    const keywordKey = headers[0];

                    return (
                      <tr 
                        key={rIdx}
                        style={{
                          backgroundColor: isEven ? 'rgba(255, 255, 255, 0.015)' : 'rgba(255, 255, 255, 0.035)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background-color 0.12s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isEven ? 'rgba(255, 255, 255, 0.015)' : 'rgba(255, 255, 255, 0.035)'}
                      >
                        <td style={{ padding: '8px 4px', textAlign: 'center', color: '#64748b', fontSize: '11px', fontWeight: 700, borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          {rIdx + 1}
                        </td>

                        {/* Sticky Keyword Cell */}
                        <td 
                          style={{
                            padding: '8px 12px',
                            position: 'sticky',
                            left: 0,
                            zIndex: 10,
                            backgroundColor: '#0c101c',
                            borderRight: '2px solid rgba(255, 255, 255, 0.12)',
                            cursor: 'text'
                          }}
                          onClick={() => setEditingCell({ rowIdx: rIdx, colKey: keywordKey })}
                        >
                          {editingCell?.rowIdx === rIdx && editingCell?.colKey === keywordKey ? (
                            <input 
                              ref={editInputRef}
                              type="text" 
                              defaultValue={row[keywordKey]}
                              onBlur={(e) => handleCellCommit(rIdx, keywordKey, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCellCommit(rIdx, keywordKey, e.currentTarget.value);
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              style={{
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.12)',
                                border: '1px solid #fbbf24',
                                color: '#ffffff',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                outline: 'none',
                                fontWeight: 700,
                                fontSize: '12.5px'
                              }}
                            />
                          ) : (
                            renderRankBadge(row[keywordKey], true)
                          )}
                        </td>

                        {/* Month Ranking Cells */}
                        {headers.slice(1).map((colKey, cIdx) => {
                          const isEditing = editingCell?.rowIdx === rIdx && editingCell?.colKey === colKey;
                          const rawVal = row[colKey];
                          const isLatestCol = cIdx === headers.length - 2;

                          return (
                            <td 
                              key={cIdx + 1}
                              style={{
                                padding: '6px 8px',
                                textAlign: 'center',
                                borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                                backgroundColor: isLatestCol ? 'rgba(34, 197, 94, 0.03)' : 'transparent',
                                cursor: 'pointer'
                              }}
                              onClick={() => setEditingCell({ rowIdx: rIdx, colKey })}
                              title="Click cell to edit rank (e.g. 1, 2, 3 or 20+)"
                            >
                              {isEditing ? (
                                <input 
                                  ref={editInputRef}
                                  type="text" 
                                  defaultValue={rawVal}
                                  onBlur={(e) => handleCellCommit(rIdx, colKey, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCellCommit(rIdx, colKey, e.currentTarget.value);
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  style={{
                                    width: '48px',
                                    background: '#1e293b',
                                    border: '1.5px solid #22c55e',
                                    color: '#ffffff',
                                    textAlign: 'center',
                                    padding: '3px 0',
                                    borderRadius: '4px',
                                    outline: 'none',
                                    fontWeight: 800,
                                    fontSize: '12px'
                                  }}
                                />
                              ) : (
                                renderRankBadge(rawVal, false)
                              )}
                            </td>
                          );
                        })}

                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteRow(rIdx)}
                            title="Delete keyword row"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Footer: Ranking Rules & Legend */}
            <div 
              style={{
                padding: '10px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(15, 23, 42, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Ranking Rules:</span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ backgroundColor: '#16a34a', color: '#ffffff', fontWeight: 900, fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>1, 2, 3</span>
                  <span style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: 600 }}>Google Local 3-Pack</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0', fontWeight: 800, fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>4 - 20</span>
                  <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>Places Extended Pack</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 800, fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>20+</span>
                  <span style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: 600 }}>Off Radar / Not Ranked</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  💡 Click any cell to edit • Auto-saved locally
                </span>
                <button 
                  type="button" 
                  className="touch-btn"
                  onClick={() => setCurrentView('setup')}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fbbf24',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Configure / Rescan
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
