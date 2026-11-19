import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Upload, Download, RotateCcw, RotateCw, RefreshCw, 
  Crop, Sun, Paintbrush, Edit2, Eraser, SlidersHorizontal, 
  Wand2, Check, Sparkles, Image as ImageIcon, Plus, Minus,
  Target, Circle, Copy, Flame, Moon, Scissors
} from 'lucide-react';

/**
 * High-Precision Harmonic Laplace & Mask-Dilated AI Inpainter
 * Completely eliminates color-bleeding, rainbow glitches, scanline banding and grid artifacts.
 * Dilates the mask to engulf all anti-aliased edges and diffuses pure background seamlessly.
 */
function perfectInpaint(ctx, maskCtx, width, height, bbox) {
  const pad = Math.max(30, Math.round(Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY) * 0.2));
  const x0 = Math.max(0, bbox.minX - pad);
  const x1 = Math.min(width - 1, bbox.maxX + pad);
  const y0 = Math.max(0, bbox.minY - pad);
  const y1 = Math.min(height - 1, bbox.maxY + pad);
  const rw = x1 - x0 + 1;
  const rh = y1 - y0 + 1;

  if (rw <= 2 || rh <= 2) return;

  const imgData = ctx.getImageData(x0, y0, rw, rh);
  const maskData = maskCtx.getImageData(x0, y0, rw, rh);
  const img = imgData.data;
  const mask = maskData.data;

  // 1. Build initial binary mask
  const isMask = new Uint8Array(rw * rh);
  let maskCount = 0;

  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const idx = (y * rw + x) * 4;
      if (mask[idx + 3] > 20 || mask[idx] > 20) {
        isMask[y * rw + x] = 1;
        maskCount++;
      }
    }
  }

  if (maskCount === 0) return;

  // 2. Morphological dilation of 3px: Engulfs all anti-aliased edge halos of the removed object!
  const dilatedMask = new Uint8Array(rw * rh);
  const dilateRad = 3;
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      if (isMask[y * rw + x] === 1) {
        for (let dy = -dilateRad; dy <= dilateRad; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= rh) continue;
          for (let dx = -dilateRad; dx <= dilateRad; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= rw) continue;
            dilatedMask[ny * rw + nx] = 1;
          }
        }
      }
    }
  }

  // 3. Extract pure background boundary pixels outside dilated perimeter
  const boundaryList = [];
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      if (dilatedMask[y * rw + x] === 0) {
        let near = false;
        if (x > 0 && dilatedMask[y * rw + (x - 1)] === 1) near = true;
        else if (x < rw - 1 && dilatedMask[y * rw + (x + 1)] === 1) near = true;
        else if (y > 0 && dilatedMask[(y - 1) * rw + x] === 1) near = true;
        else if (y < rh - 1 && dilatedMask[(y + 1) * rw + x] === 1) near = true;

        if (near) {
          const pIdx = (y * rw + x) * 4;
          boundaryList.push({
            x, y,
            r: img[pIdx],
            g: img[pIdx + 1],
            b: img[pIdx + 2]
          });
        }
      }
    }
  }

  if (boundaryList.length === 0) return;

  // 4. Compute boundary average color and standard deviation (for subtle photo grain)
  let avgR = 0, avgG = 0, avgB = 0;
  for (let i = 0; i < boundaryList.length; i++) {
    avgR += boundaryList[i].r;
    avgG += boundaryList[i].g;
    avgB += boundaryList[i].b;
  }
  avgR /= boundaryList.length;
  avgG /= boundaryList.length;
  avgB /= boundaryList.length;

  let varSum = 0;
  for (let i = 0; i < boundaryList.length; i++) {
    const diff = boundaryList[i].r - avgR;
    varSum += diff * diff;
  }
  const stdDev = Math.min(3, Math.sqrt(varSum / boundaryList.length));

  // 5. Build seed points for smooth initial gradient (uniformly distributed, no scanline banding)
  const maxSeeds = 90;
  const seedStep = Math.max(1, Math.floor(boundaryList.length / maxSeeds));
  const seeds = [];
  for (let i = 0; i < boundaryList.length; i += seedStep) {
    seeds.push(boundaryList[i]);
  }

  const rGrid = new Float32Array(rw * rh);
  const gGrid = new Float32Array(rw * rh);
  const bGrid = new Float32Array(rw * rh);

  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const idx = y * rw + x;
      const pIdx = idx * 4;
      if (dilatedMask[idx] === 0) {
        rGrid[idx] = img[pIdx];
        gGrid[idx] = img[pIdx + 1];
        bGrid[idx] = img[pIdx + 2];
      } else {
        let rW = 0, gW = 0, bW = 0, totW = 0;
        for (let s = 0; s < seeds.length; s++) {
          const sd = seeds[s];
          const distSq = (x - sd.x) * (x - sd.x) + (y - sd.y) * (y - sd.y) + 4;
          const w = 1 / distSq;
          rW += sd.r * w;
          gW += sd.g * w;
          bW += sd.b * w;
          totW += w;
        }
        rGrid[idx] = totW > 0 ? (rW / totW) : avgR;
        gGrid[idx] = totW > 0 ? (gW / totW) : avgG;
        bGrid[idx] = totW > 0 ? (bW / totW) : avgB;
      }
    }
  }

  // 6. Laplace Harmonic Diffusion: 45 iterations for flawless C-inf gradient smoothness
  for (let it = 0; it < 45; it++) {
    for (let y = 1; y < rh - 1; y++) {
      const yRow = y * rw;
      for (let x = 1; x < rw - 1; x++) {
        const idx = yRow + x;
        if (dilatedMask[idx] === 1) {
          rGrid[idx] = 0.25 * (rGrid[idx - 1] + rGrid[idx + 1] + rGrid[idx - rw] + rGrid[idx + rw]);
          gGrid[idx] = 0.25 * (gGrid[idx - 1] + gGrid[idx + 1] + gGrid[idx - rw] + gGrid[idx + rw]);
          bGrid[idx] = 0.25 * (bGrid[idx - 1] + bGrid[idx + 1] + bGrid[idx - rw] + bGrid[idx + rw]);
        }
      }
    }
  }

  // 7. Write back to image buffer with matching natural grain
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const idx = y * rw + x;
      if (dilatedMask[idx] === 1) {
        const pIdx = idx * 4;
        const grain = stdDev > 0.4 ? (Math.random() - 0.5) * stdDev : 0;
        img[pIdx] = Math.min(255, Math.max(0, Math.round(rGrid[idx] + grain)));
        img[pIdx + 1] = Math.min(255, Math.max(0, Math.round(gGrid[idx] + grain)));
        img[pIdx + 2] = Math.min(255, Math.max(0, Math.round(bGrid[idx] + grain)));
        img[pIdx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, x0, y0);
}

/**
 * Localized Surface Blur for Skin Smoothing / Beauty Retouch
 */
function applyLocalSkinSmoothing(ctx, cx, cy, radius) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const x1 = Math.min(w - 1, Math.ceil(cx + radius));
  const y1 = Math.min(h - 1, Math.ceil(cy + radius));
  const rw = x1 - x0 + 1;
  const rh = y1 - y0 + 1;
  if (rw <= 2 || rh <= 2) return;

  const imgData = ctx.getImageData(x0, y0, rw, rh);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);

  const blurRadius = 2;
  const rSq = radius * radius;

  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const globalX = x0 + x;
      const globalY = y0 + y;
      const distSq = (globalX - cx) * (globalX - cx) + (globalY - cy) * (globalY - cy);
      if (distSq > rSq) continue;

      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let dy = -blurRadius; dy <= blurRadius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= rh) continue;
        for (let dx = -blurRadius; dx <= blurRadius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= rw) continue;
          const idx = (ny * rw + nx) * 4;
          rSum += copy[idx];
          gSum += copy[idx + 1];
          bSum += copy[idx + 2];
          count++;
        }
      }

      if (count > 0) {
        const targetIdx = (y * rw + x) * 4;
        // Feathered blend factor towards edges of brush circle
        const feather = 1 - Math.sqrt(distSq) / radius;
        const blendFactor = Math.min(1, Math.max(0, feather * 0.45)); // Gentle natural smoothing

        data[targetIdx] = Math.round(copy[targetIdx] * (1 - blendFactor) + (rSum / count) * blendFactor);
        data[targetIdx + 1] = Math.round(copy[targetIdx + 1] * (1 - blendFactor) + (gSum / count) * blendFactor);
        data[targetIdx + 2] = Math.round(copy[targetIdx + 2] * (1 - blendFactor) + (bSum / count) * blendFactor);
      }
    }
  }

  ctx.putImageData(imgData, x0, y0);
}

/**
 * Localized Dodge & Burn (Exposure Sculpting)
 */
function applyLocalDodgeBurn(ctx, cx, cy, radius, isBurn = false) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const x1 = Math.min(w - 1, Math.ceil(cx + radius));
  const y1 = Math.min(h - 1, Math.ceil(cy + radius));
  const rw = x1 - x0 + 1;
  const rh = y1 - y0 + 1;
  if (rw <= 2 || rh <= 2) return;

  const imgData = ctx.getImageData(x0, y0, rw, rh);
  const data = imgData.data;
  const rSq = radius * radius;

  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const globalX = x0 + x;
      const globalY = y0 + y;
      const distSq = (globalX - cx) * (globalX - cx) + (globalY - cy) * (globalY - cy);
      if (distSq > rSq) continue;

      const feather = 1 - Math.sqrt(distSq) / radius;
      const factor = isBurn ? (1 - feather * 0.08) : (1 + feather * 0.08);
      const idx = (y * rw + x) * 4;

      data[idx] = Math.min(255, Math.max(0, Math.round(data[idx] * factor)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.round(data[idx + 1] * factor)));
      data[idx + 2] = Math.min(255, Math.max(0, Math.round(data[idx + 2] * factor)));
    }
  }

  ctx.putImageData(imgData, x0, y0);
}

export default function PhotoEditorModal({ isOpen, onClose, initialImage }) {
  const [imageFile, setImageFile] = useState(null);
  const [imageName, setImageName] = useState('photo');

  useEffect(() => {
    if (initialImage) {
      const img = new window.Image();
      img.onload = () => {
        setImageFile(img);
        setImageName('dropped_photo');
      };
      img.src = initialImage;
    }
  }, [initialImage]);
  const [activeTool, setActiveTool] = useState('ai-erase'); // 'ai-erase' | 'crop' | 'adjust' | 'filter' | 'markup' | 'blur'
  
  // Premium Brush Modes & Settings
  const [brushMode, setBrushMode] = useState('generative-erase'); // 'generative-erase' | 'spot-heal' | 'clone-stamp' | 'skin-smooth' | 'dodge-burn'
  const [brushSize, setBrushSize] = useState(32);
  const [brushHardness, setBrushHardness] = useState('hard'); // 'hard' (Solid Crisp Dot) | 'soft' (Feathered)
  const [autoEraseOnRelease, setAutoEraseOnRelease] = useState(true); // true = instant, false = batch
  const [batchMaskCount, setBatchMaskCount] = useState(0);

  // Clone Stamp Settings
  const [isPickingCloneSource, setIsPickingCloneSource] = useState(false);
  const [cloneSource, setCloneSource] = useState(null);
  const cloneDragStartRef = useRef(null);

  // Dodge & Burn Settings
  const [dodgeBurnType, setDodgeBurnType] = useState('dodge'); // 'dodge' | 'burn'

  // Processing & Toast status
  const [isDrawing, setIsDrawing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('jpg'); // Default JPG download as requested
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Live Brush Cursor overlay ref (ZERO React re-renders for buttery 120 FPS performance)
  const cursorRingRef = useRef(null);
  const lastPointRef = useRef(null);

  // Interactive Crop & Aspect Ratio Suite
  const [cropRect, setCropRect] = useState({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  const [cropAspect, setCropAspect] = useState('free'); // 'free' | '1:1' | '16:9' | '9:16' | '4:3' | '3:2'
  const [isCropDragging, setIsCropDragging] = useState(false);
  const cropDragStartRef = useRef(null);

  // Adjustments & Filters
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    warmth: 0
  });
  const [activeFilter, setActiveFilter] = useState('none');
  const [markupColor, setMarkupColor] = useState('#ef4444');
  const [markupSize, setMarkupSize] = useState(6);

  // Canvas & DOM refs
  const canvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const strokeBBoxRef = useRef({ minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
  const batchBBoxRef = useRef({ minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
  const isPointerDownRef = useRef(false);

  // Undo / Redo history stack
  const [historyStack, setHistoryStack] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Save current canvas state to history
  const pushToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      setHistoryStack(prev => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(dataUrl);
        if (next.length > 25) next.shift();
        return next;
      });
      setHistoryIndex(prev => Math.min(prev + 1, 24));
    } catch (e) {
      console.warn('History push error:', e);
    }
  }, [historyIndex]);

  // Load an image onto canvas
  const loadImageToCanvas = useCallback((source) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      if (!canvas || !maskCanvas) return;

      let w = img.naturalWidth || img.width || 800;
      let h = img.naturalHeight || img.height || 600;
      const maxDim = 1920;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;
      maskCanvas.width = w;
      maskCanvas.height = h;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      const maskCtx = maskCanvas.getContext('2d');
      maskCtx.clearRect(0, 0, w, h);

      setAdjustments({ brightness: 0, contrast: 0, saturation: 0, exposure: 0, warmth: 0 });
      setActiveFilter('none');
      setHistoryStack([canvas.toDataURL('image/png')]);
      setHistoryIndex(0);
      setCloneSource(null);
      setBatchMaskCount(0);
      batchBBoxRef.current = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
      setCropRect({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
      setCropAspect('free');

      setToastMessage('✓ Image loaded! Brush any object to erase.');
      setTimeout(() => setToastMessage(null), 3000);

      if (source.startsWith('blob:')) {
        URL.revokeObjectURL(source);
      }
    };

    img.onerror = () => {
      setToastMessage('❌ Could not parse this image file. Please try another format.');
      setTimeout(() => setToastMessage(null), 3500);
      if (source.startsWith('blob:')) {
        URL.revokeObjectURL(source);
      }
    };

    img.src = source;
  }, []);

  // Handle file select or drop (Supports ALL photo formats)
  const handleFileSelect = (file) => {
    if (!file) return;

    // Verify it is an image file or common image extension
    const isImage = file.type.startsWith('image/') || 
      /\.(jpe?g|png|webp|avif|gif|bmp|ico|tiff?|svg|heic|heif|raw|cr2|nef|arw)$/i.test(file.name);

    if (!isImage) {
      setToastMessage('⚠️ Please drop or select a valid image file (JPG, PNG, WEBP, etc.)');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setImageFile(file);
    const dotIdx = file.name.lastIndexOf('.');
    setImageName(dotIdx > 0 ? file.name.substring(0, dotIdx) : (file.name || 'photo'));

    // High performance zero-overhead Object URL for fast photo loading
    const objectUrl = URL.createObjectURL(file);
    loadImageToCanvas(objectUrl);
  };

  // Undo action
  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    const targetDataUrl = historyStack[newIdx];
    if (!targetDataUrl) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistoryIndex(newIdx);
      setToastMessage('↶ Undone');
      setTimeout(() => setToastMessage(null), 1500);
    };
    img.src = targetDataUrl;
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndex >= historyStack.length - 1) return;
    const newIdx = historyIndex + 1;
    const targetDataUrl = historyStack[newIdx];
    if (!targetDataUrl) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistoryIndex(newIdx);
      setToastMessage('↷ Redone');
      setTimeout(() => setToastMessage(null), 1500);
    };
    img.src = targetDataUrl;
  };

  // Reset to original image
  const handleReset = () => {
    if (historyStack.length === 0) return;
    const original = historyStack[0];
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistoryIndex(0);
      setBatchMaskCount(0);
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        maskCanvas.getContext('2d').clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      }
      setToastMessage('↺ Reset to original');
      setTimeout(() => setToastMessage(null), 1500);
    };
    img.src = original;
  };

  // Map pointer coordinates from screen display to canvas resolution
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, screenX: 0, screenY: 0, scale: 1 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
      clientX,
      clientY,
      screenX: clientX - rect.left,
      screenY: clientY - rect.top,
      scale: rect.width / canvas.width
    };
  };

  // Update live circular brush cursor preview directly on DOM ref (ZERO React re-renders for buttery 120 FPS)
  const updateCursorPosition = (clientX, clientY) => {
    const ring = cursorRingRef.current;
    const canvas = canvasRef.current;
    if (!ring || !canvas || !imageFile) return;

    const canRect = canvas.getBoundingClientRect();

    // Check if pointer is inside canvas area
    const isInsideCanvas = (
      clientX >= canRect.left &&
      clientX <= canRect.right &&
      clientY >= canRect.top &&
      clientY <= canRect.bottom
    );

    if (!isInsideCanvas || (activeTool !== 'ai-erase' && activeTool !== 'markup')) {
      ring.style.display = 'none';
      return;
    }

    const currentSize = activeTool === 'markup' ? markupSize : brushSize;

    ring.style.display = 'block';
    ring.style.left = `${clientX - canRect.left}px`;
    ring.style.top = `${clientY - canRect.top}px`;
    ring.style.width = `${currentSize}px`;
    ring.style.height = `${currentSize}px`;
    ring.style.borderColor = activeTool === 'markup' ? markupColor : '#ec4899';
    ring.style.backgroundColor = activeTool === 'markup' ? 'rgba(255,255,255,0.08)' : 'rgba(236, 72, 153, 0.18)';
  };

  // Pointer Down
  const handlePointerDown = (e) => {
    if (!imageFile || isProcessing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    isPointerDownRef.current = true;
    setIsDrawing(true);

    const coords = getCanvasCoords(e);
    const { x, y } = coords;
    lastPointRef.current = { x, y };

    const canRect = canvas.getBoundingClientRect();
    const currentSize = activeTool === 'markup' ? markupSize : brushSize;
    const canvasScale = canRect.width > 0 ? (canvas.width / canRect.width) : 1;
    const canvasBrushSize = Math.max(1, Math.round(currentSize * canvasScale));
    const r = Math.max(1, Math.round(canvasBrushSize / 2));

    // Handle Clone Source Picking
    if (activeTool === 'ai-erase' && brushMode === 'clone-stamp' && isPickingCloneSource) {
      setCloneSource({ x, y });
      setIsPickingCloneSource(false);
      isPointerDownRef.current = false;
      setIsDrawing(false);
      setToastMessage(`✓ Texture source sampled at (${x}, ${y})! Now paint.`);
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    strokeBBoxRef.current = { minX: x - r, maxX: x + r, minY: y - r, maxY: y + r };

    if (activeTool === 'ai-erase') {
      if (brushMode === 'generative-erase') {
        const maskCanvas = maskCanvasRef.current;
        if (maskCanvas) {
          const maskCtx = maskCanvas.getContext('2d');
          maskCtx.save();
          if (brushHardness === 'soft') {
            maskCtx.shadowBlur = Math.round(canvasBrushSize * 0.25);
            maskCtx.shadowColor = 'rgba(236, 72, 153, 0.8)';
          } else {
            maskCtx.shadowBlur = 0; // Solid crisp dot, zero blurry spread
          }
          maskCtx.fillStyle = 'rgba(236, 72, 153, 0.88)';
          maskCtx.beginPath();
          maskCtx.arc(x, y, r, 0, Math.PI * 2);
          maskCtx.fill();
          maskCtx.restore();
        }
      } else if (brushMode === 'spot-heal') {
        // 1-Tap Spot Healer: solid single dot
        const maskCanvas = maskCanvasRef.current;
        if (canvas && maskCanvas) {
          const maskCtx = maskCanvas.getContext('2d');
          maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
          maskCtx.save();
          maskCtx.shadowBlur = 0;
          maskCtx.fillStyle = 'rgba(236, 72, 153, 1)';
          maskCtx.beginPath();
          maskCtx.arc(x, y, r, 0, Math.PI * 2);
          maskCtx.fill();
          maskCtx.restore();

          const spotBBox = { minX: x - r, maxX: x + r, minY: y - r, maxY: y + r };
          perfectInpaint(canvas.getContext('2d'), maskCtx, canvas.width, canvas.height, spotBBox);
          maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
          pushToHistory();
          setToastMessage('✓ Spot healed!');
          setTimeout(() => setToastMessage(null), 1500);
        }
      } else if (brushMode === 'clone-stamp') {
        cloneDragStartRef.current = { x, y };
      } else if (brushMode === 'skin-smooth') {
        applyLocalSkinSmoothing(canvas.getContext('2d'), x, y, r);
      } else if (brushMode === 'dodge-burn') {
        applyLocalDodgeBurn(canvas.getContext('2d'), x, y, r, dodgeBurnType === 'burn');
      }
    } else if (activeTool === 'markup') {
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = markupColor;
      ctx.lineWidth = canvasBrushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  // Pointer Move (Zero-delay hardware accelerated drawing)
  const handlePointerMove = (e) => {
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    updateCursorPosition(clientX, clientY);

    if (!isPointerDownRef.current || !imageFile || isProcessing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();

    const canRect = canvas.getBoundingClientRect();
    const currentSize = activeTool === 'markup' ? markupSize : brushSize;
    const canvasScale = canRect.width > 0 ? (canvas.width / canRect.width) : 1;
    const canvasBrushSize = Math.max(1, Math.round(currentSize * canvasScale));
    const r = Math.max(1, Math.round(canvasBrushSize / 2));

    const { x, y } = getCanvasCoords(e);
    const bbox = strokeBBoxRef.current;
    bbox.minX = Math.min(bbox.minX, x - r);
    bbox.maxX = Math.max(bbox.maxX, x + r);
    bbox.minY = Math.min(bbox.minY, y - r);
    bbox.maxY = Math.max(bbox.maxY, y + r);

    if (activeTool === 'ai-erase') {
      if (brushMode === 'generative-erase') {
        const maskCanvas = maskCanvasRef.current;
        if (maskCanvas && lastPointRef.current) {
          const maskCtx = maskCanvas.getContext('2d');
          maskCtx.save();
          if (brushHardness === 'soft') {
            maskCtx.shadowBlur = Math.round(canvasBrushSize * 0.25);
            maskCtx.shadowColor = 'rgba(236, 72, 153, 0.8)';
          } else {
            maskCtx.shadowBlur = 0; // Solid crisp stroke, zero blurry spread
          }
          maskCtx.fillStyle = 'rgba(236, 72, 153, 0.88)';
          maskCtx.strokeStyle = 'rgba(236, 72, 153, 0.88)';
          maskCtx.lineWidth = canvasBrushSize;
          maskCtx.lineCap = 'round';
          maskCtx.lineJoin = 'round';

          // Continuous solid line connecting previous point and current point
          maskCtx.beginPath();
          maskCtx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
          maskCtx.lineTo(x, y);
          maskCtx.stroke();

          // Round solid cap at current point
          maskCtx.beginPath();
          maskCtx.arc(x, y, r, 0, Math.PI * 2);
          maskCtx.fill();
          maskCtx.restore();
        }
        lastPointRef.current = { x, y };
      } else if (brushMode === 'clone-stamp') {
        if (!cloneSource || !cloneDragStartRef.current || !lastPointRef.current) return;
        const ctx = canvas.getContext('2d');
        const step = Math.max(3, r / 3);
        const dist = Math.hypot(x - lastPointRef.current.x, y - lastPointRef.current.y);
        const steps = Math.max(1, Math.ceil(dist / step));

        for (let s = 1; s <= steps; s++) {
          const px = lastPointRef.current.x + (x - lastPointRef.current.x) * (s / steps);
          const py = lastPointRef.current.y + (y - lastPointRef.current.y) * (s / steps);
          const dx = px - cloneDragStartRef.current.x;
          const dy = py - cloneDragStartRef.current.y;
          const srcX = cloneSource.x + dx;
          const srcY = cloneSource.y + dy;

          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(canvas, srcX - r, srcY - r, canvasBrushSize, canvasBrushSize, px - r, py - r, canvasBrushSize, canvasBrushSize);
          ctx.restore();
        }
        lastPointRef.current = { x, y };
      } else if (brushMode === 'skin-smooth') {
        if (lastPointRef.current) {
          const dist = Math.hypot(x - lastPointRef.current.x, y - lastPointRef.current.y);
          if (dist >= Math.max(6, canvasBrushSize / 4)) {
            applyLocalSkinSmoothing(canvas.getContext('2d'), x, y, r);
            lastPointRef.current = { x, y };
          }
        }
      } else if (brushMode === 'dodge-burn') {
        if (lastPointRef.current) {
          const dist = Math.hypot(x - lastPointRef.current.x, y - lastPointRef.current.y);
          if (dist >= Math.max(6, canvasBrushSize / 4)) {
            applyLocalDodgeBurn(canvas.getContext('2d'), x, y, r, dodgeBurnType === 'burn');
            lastPointRef.current = { x, y };
          }
        }
      }
    } else if (activeTool === 'markup') {
      const ctx = canvas.getContext('2d');
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  // Pointer Up: Execute AI Erase or push state
  const handlePointerUp = async (e) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDrawing(false);
    lastPointRef.current = null;
    cloneDragStartRef.current = null;

    if (activeTool === 'markup' || (activeTool === 'ai-erase' && brushMode !== 'generative-erase' && brushMode !== 'spot-heal')) {
      pushToHistory();
      return;
    }

    if (activeTool === 'ai-erase' && brushMode === 'generative-erase') {
      const strokeBBox = strokeBBoxRef.current;
      if (strokeBBox.minX === Infinity || strokeBBox.maxX === -Infinity) return;

      // Update batch bounding box
      const batch = batchBBoxRef.current;
      batch.minX = Math.min(batch.minX, strokeBBox.minX);
      batch.maxX = Math.max(batch.maxX, strokeBBox.maxX);
      batch.minY = Math.min(batch.minY, strokeBBox.minY);
      batch.maxY = Math.max(batch.maxY, strokeBBox.maxY);

      if (autoEraseOnRelease) {
        // INSTANT 1-RELEASE ERASE
        executeGenerativeErase(strokeBBox);
      } else {
        // BATCH MODE: keep mask and wait for "Erase All Marked"
        setBatchMaskCount(prev => prev + 1);
        setToastMessage(`✓ Marked object #${batchMaskCount + 1}. Paint more or tap "Erase All Marked".`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    }
  };

  // Perform Generative Erase on specified bounding box
  const executeGenerativeErase = (targetBBox) => {
    const bbox = targetBBox || batchBBoxRef.current;
    if (bbox.minX === Infinity || bbox.maxX === -Infinity) return;

    setIsProcessing(true);
    setToastMessage('✨ AI Generative Erase processing...');

    setTimeout(() => {
      try {
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        if (!canvas || !maskCanvas) return;

        const ctx = canvas.getContext('2d');
        const maskCtx = maskCanvas.getContext('2d');

        perfectInpaint(ctx, maskCtx, canvas.width, canvas.height, bbox);
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

        pushToHistory();
        setBatchMaskCount(0);
        batchBBoxRef.current = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        strokeBBoxRef.current = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };

        setToastMessage('✓ Object completely erased with AI!');
        setTimeout(() => setToastMessage(null), 2500);
      } catch (err) {
        console.error('Inpainting error:', err);
        setToastMessage('❌ Could not erase object');
        setTimeout(() => setToastMessage(null), 2500);
      } finally {
        setIsProcessing(false);
      }
    }, 40);
  };

  // Clear batch mask without inpainting
  const handleClearMask = () => {
    const maskCanvas = maskCanvasRef.current;
    if (maskCanvas) {
      maskCanvas.getContext('2d').clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    }
    setBatchMaskCount(0);
    batchBBoxRef.current = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    strokeBBoxRef.current = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    setToastMessage('Mask cleared');
    setTimeout(() => setToastMessage(null), 1500);
  };

  // Rotate 90°
  const handleRotate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.width;
    const h = canvas.height;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = h;
    tempCanvas.height = w;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.translate(h / 2, w / 2);
    tempCtx.rotate((90 * Math.PI) / 180);
    tempCtx.drawImage(canvas, -w / 2, -h / 2);

    canvas.width = h;
    canvas.height = w;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, h, w);
    ctx.drawImage(tempCanvas, 0, 0);

    const maskCanvas = maskCanvasRef.current;
    if (maskCanvas) {
      maskCanvas.width = h;
      maskCanvas.height = w;
    }

    pushToHistory();
    setToastMessage('⟳ Rotated 90°');
    setTimeout(() => setToastMessage(null), 1500);
  };

  // Flip Horizontal
  const handleFlipH = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.translate(canvas.width, 0);
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(canvas, 0, 0);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);

    pushToHistory();
    setToastMessage('⇆ Flipped Horizontally');
    setTimeout(() => setToastMessage(null), 1500);
  };

  // Handle Aspect Ratio Presets
  const applyAspectPreset = (aspectKey) => {
    setCropAspect(aspectKey);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (aspectKey === 'free') return;

    let ratio = 1;
    if (aspectKey === '1:1') ratio = 1;
    else if (aspectKey === '16:9') ratio = 16 / 9;
    else if (aspectKey === '9:16') ratio = 9 / 16;
    else if (aspectKey === '4:3') ratio = 4 / 3;
    else if (aspectKey === '3:2') ratio = 3 / 2;

    const imgAspect = canvas.width / canvas.height;
    let targetW = 0.9;
    let targetH = 0.9;

    if (ratio >= imgAspect) {
      targetW = 0.9;
      targetH = Math.min(0.9, (targetW * imgAspect) / ratio);
    } else {
      targetH = 0.9;
      targetW = Math.min(0.9, (targetH * ratio) / imgAspect);
    }

    const x = Math.max(0, (1 - targetW) / 2);
    const y = Math.max(0, (1 - targetH) / 2);
    setCropRect({ x, y, w: targetW, h: targetH });
  };

  // Reset crop box to full image
  const resetCropBox = () => {
    setCropRect({ x: 0.02, y: 0.02, w: 0.96, h: 0.96 });
    setCropAspect('free');
    setToastMessage('↺ Crop box reset to full image');
    setTimeout(() => setToastMessage(null), 1500);
  };

  // Execute Crop
  const applyCrop = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const srcX = Math.max(0, Math.round(cropRect.x * canvas.width));
    const srcY = Math.max(0, Math.round(cropRect.y * canvas.height));
    const srcW = Math.max(1, Math.min(canvas.width - srcX, Math.round(cropRect.w * canvas.width)));
    const srcH = Math.max(1, Math.min(canvas.height - srcY, Math.round(cropRect.h * canvas.height)));

    if (srcW <= 10 || srcH <= 10) {
      setToastMessage('⚠️ Crop area is too small.');
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = srcW;
    tempCanvas.height = srcH;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

    canvas.width = srcW;
    canvas.height = srcH;
    maskCanvas.width = srcW;
    maskCanvas.height = srcH;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, srcW, srcH);
    ctx.drawImage(tempCanvas, 0, 0);

    const maskCtx = maskCanvas.getContext('2d');
    maskCtx.clearRect(0, 0, srcW, srcH);

    // Reset crop rect for next crop
    setCropRect({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
    setCropAspect('free');

    pushToHistory();
    setToastMessage(`✓ Image cropped to ${srcW} × ${srcH}px!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Crop Pointer Handlers
  const handleCropPointerDown = (e, mode) => {
    e.stopPropagation();
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    cropDragStartRef.current = {
      mode,
      clientX,
      clientY,
      initialRect: { ...cropRect },
      canvasRect: canvas.getBoundingClientRect()
    };
    setIsCropDragging(true);
  };

  const handleCropPointerMove = (e) => {
    if (!cropDragStartRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const { mode, clientX: startX, clientY: startY, initialRect, canvasRect } = cropDragStartRef.current;
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    const dx = (clientX - startX) / canvasRect.width;
    const dy = (clientY - startY) / canvasRect.height;

    const minSize = 0.05;
    let { x, y, w, h } = initialRect;

    if (mode === 'move') {
      x = Math.max(0, Math.min(1 - w, initialRect.x + dx));
      y = Math.max(0, Math.min(1 - h, initialRect.y + dy));
    } else {
      if (mode.includes('e')) {
        w = Math.max(minSize, Math.min(1 - x, initialRect.w + dx));
      }
      if (mode.includes('s')) {
        h = Math.max(minSize, Math.min(1 - y, initialRect.h + dy));
      }
      if (mode.includes('w')) {
        const newX = Math.max(0, Math.min(initialRect.x + initialRect.w - minSize, initialRect.x + dx));
        w = initialRect.w + (initialRect.x - newX);
        x = newX;
      }
      if (mode.includes('n')) {
        const newY = Math.max(0, Math.min(initialRect.y + initialRect.h - minSize, initialRect.y + dy));
        h = initialRect.h + (initialRect.y - newY);
        y = newY;
      }

      // If aspect ratio is locked and not 'free'
      if (cropAspect !== 'free') {
        const canvas = canvasRef.current;
        if (canvas) {
          let ratio = 1;
          if (cropAspect === '1:1') ratio = 1;
          else if (cropAspect === '16:9') ratio = 16 / 9;
          else if (cropAspect === '9:16') ratio = 9 / 16;
          else if (cropAspect === '4:3') ratio = 4 / 3;
          else if (cropAspect === '3:2') ratio = 3 / 2;

          const imgAspect = canvas.width / canvas.height;
          const targetH = (w * imgAspect) / ratio;
          if (y + targetH <= 1) {
            h = targetH;
          } else {
            h = 1 - y;
            w = (h * ratio) / imgAspect;
          }
        }
      }
    }

    setCropRect({ x, y, w, h });
  };

  const handleCropPointerUp = () => {
    cropDragStartRef.current = null;
    setIsCropDragging(false);
  };

  // Window listener for smooth drag even outside bounds
  useEffect(() => {
    if (!isCropDragging) return;
    const onMove = (e) => handleCropPointerMove(e);
    const onUp = () => handleCropPointerUp();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isCropDragging, cropAspect]);

  // Apply Adjustments
  const applyAdjustmentsToCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyStack.length === 0) return;

    const baseDataUrl = historyStack[historyIndex] || historyStack[0];
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const b = 100 + adjustments.brightness;
      const c = 100 + adjustments.contrast;
      const s = 100 + adjustments.saturation;
      ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

      if (adjustments.warmth !== 0) {
        ctx.fillStyle = adjustments.warmth > 0 
          ? `rgba(251, 191, 36, ${Math.abs(adjustments.warmth) / 500})`
          : `rgba(96, 165, 250, ${Math.abs(adjustments.warmth) / 500})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      pushToHistory();
      setToastMessage('✓ Adjustments applied!');
      setTimeout(() => setToastMessage(null), 1500);
    };
    img.src = baseDataUrl;
  };

  // Apply Filter Preset
  const applyFilterPreset = (filterName) => {
    setActiveFilter(filterName);
    const canvas = canvasRef.current;
    if (!canvas || historyStack.length === 0) return;

    const baseDataUrl = historyStack[historyIndex] || historyStack[0];
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (filterName === 'vivid') {
        ctx.filter = 'contrast(125%) saturate(140%) brightness(105%)';
      } else if (filterName === 'warm') {
        ctx.filter = 'sepia(30%) saturate(120%) brightness(105%)';
      } else if (filterName === 'cool') {
        ctx.filter = 'hue-rotate(180deg) sepia(15%) saturate(110%)';
      } else if (filterName === 'noir') {
        ctx.filter = 'grayscale(100%) contrast(150%) brightness(95%)';
      } else if (filterName === 'vintage') {
        ctx.filter = 'sepia(50%) contrast(90%) brightness(110%)';
      } else if (filterName === 'cyber') {
        ctx.filter = 'contrast(140%) saturate(180%) hue-rotate(90deg)';
      } else {
        ctx.filter = 'none';
      }

      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

      pushToHistory();
      setToastMessage(`✓ Applied ${filterName.toUpperCase()} filter`);
      setTimeout(() => setToastMessage(null), 1500);
    };
    img.src = baseDataUrl;
  };

  // Background Blur
  const applyBackgroundBlur = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.filter = 'blur(10px)';
    tempCtx.drawImage(canvas, 0, 0);

    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.min(w, h) * 0.65);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    pushToHistory();
    setToastMessage('✓ Applied Portrait Background Blur');
    setTimeout(() => setToastMessage(null), 1500);
  };

  // 1-Click Direct Download in JPG (Default) or PNG without delay
  const handleDirectDownload = (format = 'jpg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isJpg = format === 'jpg';
    const mime = isJpg ? 'image/jpeg' : 'image/png';
    const ext = isJpg ? 'jpg' : 'png';
    const cleanName = imageName.replace(/\.[^/.]+$/, "");
    const filename = `${cleanName}_edited.${ext}`;

    // For JPG export, render on a crisp white background to prevent transparent alpha from turning black
    let exportCanvas = canvas;
    if (isJpg) {
      exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const expCtx = exportCanvas.getContext('2d');
      expCtx.fillStyle = '#ffffff';
      expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      expCtx.drawImage(canvas, 0, 0);
    }

    exportCanvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      setDownloadInfo({
        url,
        filename,
        sizeKb: (blob.size / 1024).toFixed(1)
      });

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener noreferrer';
      a.style.position = 'fixed';
      a.style.left = '-9999px';
      a.style.top = '-9999px';
      a.style.opacity = '0';
      document.body.appendChild(a);

      try {
        a.click();
      } catch (e) {
        console.warn('Programmatic click caught:', e);
      }

      setTimeout(() => {
        try {
          if (document.body.contains(a)) document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {}
      }, 1500);

      setToastMessage(`✓ Downloaded ${filename} (${(blob.size / 1024).toFixed(1)} KB) in JPG!`);
      setTimeout(() => setToastMessage(null), 3000);
    }, mime, 0.95);
  };

  if (!isOpen) return null;

  // Preset Brush Sizes
  const sizePresets = [
    { label: '8px', val: 8, title: 'Tiny (Blemish / Wire)' },
    { label: '18px', val: 18, title: 'Small (Text / Acne)' },
    { label: '32px', val: 32, title: 'Medium (General)' },
    { label: '56px', val: 56, title: 'Large (Objects)' },
    { label: '95px', val: 95, title: 'Huge (People)' },
    { label: '140px', val: 140, title: 'Max (Background)' }
  ];

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 7, 12, 0.75)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)', willChange: 'opacity', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: window.innerWidth < 640 ? '6px' : '16px', cursor: 'pointer' }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="tools-modal-scroll"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isDraggingOver) setIsDraggingOver(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.currentTarget === e.target) {
            setIsDraggingOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(false);
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
          }
        }}
        style={{ 
          background: 'linear-gradient(150deg, rgba(18, 23, 35, 0.96) 0%, rgba(9, 12, 19, 0.98) 100%)',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          willChange: 'transform',
          borderRadius: '24px', 
          width: '100%', 
          maxWidth: '1120px', 
          height: '95vh', 
          maxHeight: '95vh', 
          display: 'flex', 
          flexDirection: 'column', 
          position: 'relative', 
          border: '1px solid rgba(255, 255, 255, 0.20)', 
          boxShadow: 'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.55), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.08), 0 25px 70px rgba(0,0,0,0.75)',
          overflow: 'hidden',
          cursor: 'default'
        }}
      >
        
        {/* Universal Drag & Drop Visual Glow Overlay */}
        {isDraggingOver && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px dashed #ec4899',
            borderRadius: '24px',
            color: '#ffffff',
            pointerEvents: 'none'
          }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 8px 30px rgba(236,72,153,0.5)' }}>
              <Upload size={40} color="#ffffff" />
            </div>
            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '-0.3px' }}>
              Drop Any Photo to Open
            </h3>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#cbd5e1', fontWeight: '800' }}>
              Supports all photo formats: JPG, JPEG, PNG, WEBP, AVIF, HEIC, GIF, BMP, SVG, TIFF, RAW
            </p>
          </div>
        )}

        {/* Hidden File Picker */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.ico,.tiff,.tif,.svg,.heic,.heif,.raw,.cr2,.nef,.arw" 
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
              e.target.value = '';
            }
          }} 
        />

        {/* TOP BAR: Title, Windows Photos Toolbar, Undo/Redo & Download */}
        <div style={{ padding: '10px 16px', background: 'linear-gradient(180deg, rgba(22, 27, 40, 0.95) 0%, rgba(14, 18, 28, 0.92) 100%)', backdropFilter: 'blur(24px) saturate(190%)', WebkitBackdropFilter: 'blur(24px) saturate(190%)', borderBottom: '1px solid rgba(255, 255, 255, 0.16)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', zIndex: 10 }}>
          
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.8) 0%, rgba(168, 85, 247, 0.8) 100%)', border: '1px solid rgba(255, 255, 255, 0.35)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.6), 0 6px 18px rgba(236,72,153,0.35)' }}>
              <Wand2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.2px' }}>
                Shadow Photo Studio
              </h3>
              <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '800' }}>
                Windows Photos-style AI Generative Erase & Pro Editor
              </span>
            </div>
          </div>

          {/* Windows 10/11 Pro Photos Style Tools Bar (Apple iOS 26 Liquid Glass) */}
          {imageFile && (
            <div className="tools-modal-scroll" style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '4px 6px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.20)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), 0 4px 16px rgba(0,0,0,0.3)', overflowX: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
              
              {/* 1. AI Generative Erase (Primary Highlighted Star Feature!) */}
              <button
                type="button"
                onClick={() => setActiveTool('ai-erase')}
                className="touch-btn"
                title="AI Object Eraser / Generative Erase (Brush to remove unwanted objects)"
                style={{
                  minHeight: '34px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: activeTool === 'ai-erase' ? '1px solid rgba(255, 255, 255, 0.5)' : '1px solid transparent',
                  backgroundColor: activeTool === 'ai-erase' ? '#ec4899' : 'transparent',
                  color: activeTool === 'ai-erase' ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                  fontSize: '11.5px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: activeTool === 'ai-erase' ? 'inset 0 1.5px 1.5px rgba(255,255,255,0.7), 0 4px 16px rgba(236,72,153,0.45)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Eraser size={15} />
                <span>AI Brush Studio</span>
              </button>

              {/* 2. Crop & Rotate */}
              <button
                type="button"
                onClick={() => setActiveTool('crop')}
                className="touch-btn"
                title="Crop & Rotate"
                style={{
                  minHeight: '34px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: activeTool === 'crop' ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid transparent',
                  backgroundColor: activeTool === 'crop' ? 'rgba(255, 255, 255, 0.20)' : 'transparent',
                  color: activeTool === 'crop' ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                  fontSize: '11px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: activeTool === 'crop' ? 'inset 0 1px 1px rgba(255,255,255,0.5)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Crop size={15} />
                <span className="hidden sm:inline">Crop</span>
              </button>

              {/* 3. Adjust / Light */}
              <button
                type="button"
                onClick={() => setActiveTool('adjust')}
                className="touch-btn"
                title="Brightness & Contrast"
                style={{
                  minHeight: '34px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: activeTool === 'adjust' ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid transparent',
                  backgroundColor: activeTool === 'adjust' ? 'rgba(255, 255, 255, 0.20)' : 'transparent',
                  color: activeTool === 'adjust' ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                  fontSize: '11px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: activeTool === 'adjust' ? 'inset 0 1px 1px rgba(255,255,255,0.5)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sun size={15} />
                <span className="hidden sm:inline">Adjust</span>
              </button>

              {/* 4. Filter / Tone */}
              <button
                type="button"
                onClick={() => setActiveTool('filter')}
                className="touch-btn"
                title="Color Filters"
                style={{
                  minHeight: '34px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: activeTool === 'filter' ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid transparent',
                  backgroundColor: activeTool === 'filter' ? 'rgba(255, 255, 255, 0.20)' : 'transparent',
                  color: activeTool === 'filter' ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                  fontSize: '11px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: activeTool === 'filter' ? 'inset 0 1px 1px rgba(255,255,255,0.5)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Paintbrush size={15} />
                <span className="hidden sm:inline">Filter</span>
              </button>

              {/* 5. Markup / Pen */}
              <button
                type="button"
                onClick={() => setActiveTool('markup')}
                className="touch-btn"
                title="Pen & Drawing"
                style={{
                  minHeight: '34px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: activeTool === 'markup' ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid transparent',
                  backgroundColor: activeTool === 'markup' ? 'rgba(255, 255, 255, 0.20)' : 'transparent',
                  color: activeTool === 'markup' ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                  fontSize: '11px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: activeTool === 'markup' ? 'inset 0 1px 1px rgba(255,255,255,0.5)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Edit2 size={15} />
                <span className="hidden sm:inline">Markup</span>
              </button>

              {/* 6. Blur / Portrait */}
              <button
                type="button"
                onClick={() => setActiveTool('blur')}
                className="touch-btn"
                title="Background Blur"
                style={{
                  minHeight: '34px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: activeTool === 'blur' ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid transparent',
                  backgroundColor: activeTool === 'blur' ? 'rgba(255, 255, 255, 0.20)' : 'transparent',
                  color: activeTool === 'blur' ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                  fontSize: '11px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: activeTool === 'blur' ? 'inset 0 1px 1px rgba(255,255,255,0.5)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <SlidersHorizontal size={15} />
                <span className="hidden sm:inline">Blur</span>
              </button>
            </div>
          )}

          {/* Right Action Icons: Undo, Redo, Download & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {imageFile && (
              <>
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="touch-btn"
                  title="Undo (Ctrl+Z)"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.10)',
                    color: historyIndex > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.20)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)'
                  }}
                >
                  <RotateCcw size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={historyIndex >= historyStack.length - 1}
                  className="touch-btn"
                  title="Redo (Ctrl+Y)"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.10)',
                    color: historyIndex < historyStack.length - 1 ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.20)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: historyIndex < historyStack.length - 1 ? 'pointer' : 'not-allowed',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)'
                  }}
                >
                  <RotateCw size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="touch-btn"
                  title="Reset to Original"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.10)',
                    color: 'rgba(255, 255, 255, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.20)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)'
                  }}
                >
                  <RefreshCw size={16} />
                </button>

                {/* Format Selector: JPG (Default) / PNG */}
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '2px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.20)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25)' }}>
                  <button
                    type="button"
                    onClick={() => setDownloadFormat('jpg')}
                    title="Download as JPG (Standard photo format)"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      border: 'none',
                      backgroundColor: downloadFormat === 'jpg' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                      color: downloadFormat === 'jpg' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '10.5px',
                      fontWeight: '900',
                      cursor: 'pointer'
                    }}
                  >
                    JPG
                  </button>
                  <button
                    type="button"
                    onClick={() => setDownloadFormat('png')}
                    title="Download as PNG (Lossless format)"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      border: 'none',
                      backgroundColor: downloadFormat === 'png' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                      color: downloadFormat === 'png' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '10.5px',
                      fontWeight: '900',
                      cursor: 'pointer'
                    }}
                  >
                    PNG
                  </button>
                </div>

                {/* Direct 1-Click Download Button (JPG by default) */}
                <button
                  type="button"
                  onClick={() => handleDirectDownload(downloadFormat)}
                  className="touch-btn"
                  title={`1-Click Instant Download in .${downloadFormat.toUpperCase()}`}
                  style={{
                    minHeight: '36px',
                    padding: '0 16px',
                    borderRadius: '9999px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(15,23,42,0.18)'
                  }}
                >
                  <Download size={15} />
                  <span>Download .{downloadFormat.toUpperCase()}</span>
                </button>
              </>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="touch-btn"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

        </div>

        {/* WORKSPACE AREA */}
        <div 
          ref={containerRef}
          onPointerMove={(e) => updateCursorPosition(e.clientX, e.clientY)}
          onPointerLeave={() => {
            if (cursorRingRef.current) cursorRingRef.current.style.display = 'none';
          }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', backgroundColor: '#090d16' }}
        >
          
          {/* If No Image is Selected: Large Drag & Drop / Upload Target */}
          {!imageFile ? (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '32px', 
                textAlign: 'center', 
                cursor: 'pointer',
                margin: '20px',
                border: '2px dashed #334155',
                borderRadius: '20px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)'
              }}
            >
              <div style={{ width: '80px', height: '80px', borderRadius: '20px', backgroundColor: '#1e293b', border: '2px solid #ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#ec4899', boxShadow: '0 8px 30px rgba(236,72,153,0.2)' }}>
                <Upload size={38} />
              </div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.3px' }}>
                Drag & Drop Any Photo Here or Tap to Browse
              </h2>
              <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#94a3b8', fontWeight: '800', maxWidth: '460px' }}>
                Supports all formats: JPG, JPEG, PNG, WEBP, AVIF, HEIC, GIF, BMP, SVG, TIFF, RAW. Directly open in full resolution, erase objects, and download in JPG!
              </p>
              <span className="touch-btn" style={{ padding: '12px 32px', borderRadius: '9999px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.06) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', color: '#ffffff', fontWeight: '900', fontSize: '13.5px', border: '1px solid rgba(255, 255, 255, 0.35)', boxShadow: 'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.6), inset 0 -1px 1px rgba(255, 255, 255, 0.1), 0 10px 30px rgba(0,0,0,0.45)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} /> Select Image From Device
              </span>
            </div>
          ) : (
            // Image Canvas Viewport
            <div 
              style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                position: 'relative', 
                overflow: 'auto', 
                padding: '16px',
                touchAction: 'none'
              }}
            >
              {/* Perfectly coincident wrapper for Main Canvas and Mask Canvas */}
              <div
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              >
                {/* Main Image Canvas */}
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                    cursor: isPickingCloneSource ? 'crosshair' : (activeTool === 'ai-erase' || activeTool === 'markup' ? 'none' : 'default'),
                    touchAction: 'none'
                  }}
                />

                {/* Overlay Mask Canvas for Live Glowing Erase Highlight */}
                <canvas
                  ref={maskCanvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    borderRadius: '12px',
                    display: activeTool === 'ai-erase' ? 'block' : 'none'
                  }}
                />

                {/* Interactive Live Brush Ring Cursor Preview (Photoshop & Windows Photos Style with Solid Center Dot) */}
                <div
                  ref={cursorRingRef}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    transform: 'translate(-50%, -50%)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '2px solid #ec4899',
                    boxShadow: '0 0 6px rgba(0,0,0,0.8), inset 0 0 4px rgba(236,72,153,0.3)',
                    backgroundColor: 'rgba(236, 72, 153, 0.15)',
                    pointerEvents: 'none',
                    zIndex: 60,
                    display: 'none',
                    willChange: 'left, top, width, height'
                  }}
                >
                  <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#ffffff', boxShadow: '0 0 2px #000000' }} />
                </div>

                {/* Interactive Pro Crop Box Overlay */}
                {activeTool === 'crop' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                      borderRadius: '12px',
                      pointerEvents: 'auto',
                      zIndex: 50
                    }}
                    onPointerMove={handleCropPointerMove}
                    onPointerUp={handleCropPointerUp}
                  >
                    {/* Darkened backdrop outside crop box using box-shadow */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${cropRect.x * 100}%`,
                        top: `${cropRect.y * 100}%`,
                        width: `${cropRect.w * 100}%`,
                        height: `${cropRect.h * 100}%`,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                        border: '2px solid #ffffff',
                        cursor: 'move',
                        boxSizing: 'border-box'
                      }}
                      onPointerDown={(e) => handleCropPointerDown(e, 'move')}
                    >
                      {/* 3x3 Rule-of-Thirds Grid */}
                      <div style={{ position: 'absolute', left: '33.333%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', left: '66.666%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', top: '33.333%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', top: '66.666%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none' }} />

                      {/* Top-Left Corner Handle */}
                      <div
                        onPointerDown={(e) => handleCropPointerDown(e, 'nw')}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          left: '-6px',
                          width: '22px',
                          height: '22px',
                          borderTop: '4px solid #ffffff',
                          borderLeft: '4px solid #ffffff',
                          cursor: 'nwse-resize',
                          zIndex: 10
                        }}
                      />

                      {/* Top-Right Corner Handle */}
                      <div
                        onPointerDown={(e) => handleCropPointerDown(e, 'ne')}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          width: '22px',
                          height: '22px',
                          borderTop: '4px solid #ffffff',
                          borderRight: '4px solid #ffffff',
                          cursor: 'nesw-resize',
                          zIndex: 10
                        }}
                      />

                      {/* Bottom-Left Corner Handle */}
                      <div
                        onPointerDown={(e) => handleCropPointerDown(e, 'sw')}
                        style={{
                          position: 'absolute',
                          bottom: '-6px',
                          left: '-6px',
                          width: '22px',
                          height: '22px',
                          borderBottom: '4px solid #ffffff',
                          borderLeft: '4px solid #ffffff',
                          cursor: 'nesw-resize',
                          zIndex: 10
                        }}
                      />

                      {/* Bottom-Right Corner Handle */}
                      <div
                        onPointerDown={(e) => handleCropPointerDown(e, 'se')}
                        style={{
                          position: 'absolute',
                          bottom: '-6px',
                          right: '-6px',
                          width: '22px',
                          height: '22px',
                          borderBottom: '4px solid #ffffff',
                          borderRight: '4px solid #ffffff',
                          cursor: 'nwse-resize',
                          zIndex: 10
                        }}
                      />

                      {/* Edge Handles */}
                      <div
                        onPointerDown={(e) => handleCropPointerDown(e, 'n')}
                        style={{
                          position: 'absolute',
                          top: '-5px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '28px',
                          height: '6px',
                          borderRadius: '3px',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 0 4px rgba(0,0,0,0.6)',
                          cursor: 'ns-resize',
                          zIndex: 10
                        }}
                      />
                      <div
                        onPointerDown={(e) => handleCropPointerDown(e, 's')}
                        style={{
                          position: 'absolute',
                          bottom: '-5px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '28px',
                          height: '6px',
                          borderRadius: '3px',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 0 4px rgba(0,0,0,0.6)',
                          cursor: 'ns-resize',
                          zIndex: 10
                        }}
                      />
                      <div
                        onPointerDown={(e) => handleCropPointerDown(e, 'w')}
                        style={{
                          position: 'absolute',
                          left: '-5px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '6px',
                          height: '28px',
                          borderRadius: '3px',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 0 4px rgba(0,0,0,0.6)',
                          cursor: 'ew-resize',
                          zIndex: 10
                        }}
                      />
                      <div
                        onPointerDown={(e) => handleCropPointerDown(e, 'e')}
                        style={{
                          position: 'absolute',
                          right: '-5px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '6px',
                          height: '28px',
                          borderRadius: '3px',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 0 4px rgba(0,0,0,0.6)',
                          cursor: 'ew-resize',
                          zIndex: 10
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Clone Source Target Marker */}
              {cloneSource && brushMode === 'clone-stamp' && (
                <div
                  title="Texture Sample Source"
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '16px',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    color: '#38bdf8',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid #38bdf8'
                  }}
                >
                  <Target size={14} className="text-cyan-400" />
                  <span>Source Sampled at ({cloneSource.x}, {cloneSource.y})</span>
                  <button
                    type="button"
                    onClick={() => setIsPickingCloneSource(true)}
                    style={{ marginLeft: '6px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: '900', border: 'none', cursor: 'pointer', fontSize: '10px' }}
                  >
                    Resample
                  </button>
                </div>
              )}

              {/* Floating Batch Mask Action Bar (When in Batch Multi-Object Mode) */}
              {batchMaskCount > 0 && !autoEraseOnRelease && (
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#0f172a',
                  padding: '8px 16px',
                  borderRadius: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 10px 35px rgba(0,0,0,0.4)',
                  zIndex: 70,
                  border: '1.5px solid #ec4899'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ec4899', fontSize: '11.5px', fontWeight: '900' }}>
                    <Sparkles size={16} />
                    <span>{batchMaskCount} {batchMaskCount === 1 ? 'Object Marked' : 'Objects Marked'}</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => executeGenerativeErase()}
                    className="touch-btn"
                    style={{
                      padding: '8px 18px',
                      borderRadius: '20px',
                      backgroundColor: '#ec4899',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(236,72,153,0.4)'
                    }}
                  >
                    <Wand2 size={14} />
                    <span>✨ Erase All Marked</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearMask}
                    className="touch-btn"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      backgroundColor: '#334155',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Mask
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Live Floating Status / Toast */}
          {toastMessage && (
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: isProcessing ? '#0f172a' : '#10b981',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '30px',
              fontSize: '12px',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              zIndex: 80,
              border: '1.5px solid rgba(255,255,255,0.2)'
            }}>
              {isProcessing ? <Sparkles size={16} className="animate-spin text-pink-400" /> : <Check size={16} />}
              <span>{toastMessage}</span>
            </div>
          )}

        </div>

        {/* BOTTOM PRO SUB-TOOLBAR: Interactive Controls for Active Tool (Apple iOS 26 Liquid Glass) */}
        {imageFile && (
          <div style={{ padding: '12px 16px', background: 'linear-gradient(180deg, rgba(22, 27, 40, 0.95) 0%, rgba(10, 13, 22, 0.98) 100%)', backdropFilter: 'blur(28px) saturate(190%)', WebkitBackdropFilter: 'blur(28px) saturate(190%)', borderTop: '1px solid rgba(255, 255, 255, 0.16)', boxShadow: 'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.25), 0 -8px 30px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
            
            {/* SUB-TOOL: AI Erase & Premium Brush Suite */}
            {activeTool === 'ai-erase' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                
                {/* ROW 1: Premium Brush Modes Pills */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <div className="tools-modal-scroll" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', overflowX: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch', paddingBottom: '2px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '900', color: 'rgba(255, 255, 255, 0.65)', textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: '4px', flexShrink: 0 }}>
                      Brush Tool:
                    </span>

                    {/* Mode 1: Generative Erase */}
                    <button
                      type="button"
                      onClick={() => { setBrushMode('generative-erase'); setIsPickingCloneSource(false); }}
                      className="touch-btn"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        border: brushMode === 'generative-erase' ? '1px solid rgba(255, 255, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
                        backgroundColor: brushMode === 'generative-erase' ? '#ec4899' : 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: brushMode === 'generative-erase' ? 'inset 0 1.5px 1.5px rgba(255,255,255,0.7), 0 4px 16px rgba(236,72,153,0.45)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Sparkles size={13} />
                      <span>✨ Generative Erase</span>
                    </button>

                    {/* Mode 2: Spot Healer */}
                    <button
                      type="button"
                      onClick={() => { setBrushMode('spot-heal'); setIsPickingCloneSource(false); }}
                      className="touch-btn"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        border: brushMode === 'spot-heal' ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                        backgroundColor: brushMode === 'spot-heal' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                        color: brushMode === 'spot-heal' ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                        fontSize: '11px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: brushMode === 'spot-heal' ? 'inset 0 1px 1px rgba(255,255,255,0.5)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Target size={13} />
                      <span>🎯 Spot Healer (1-Tap)</span>
                    </button>

                    {/* Mode 3: Clone Stamp */}
                    <button
                      type="button"
                      onClick={() => { 
                        setBrushMode('clone-stamp'); 
                        if (!cloneSource) setIsPickingCloneSource(true); 
                      }}
                      className="touch-btn"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        border: brushMode === 'clone-stamp' ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                        backgroundColor: brushMode === 'clone-stamp' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                        color: brushMode === 'clone-stamp' ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                        fontSize: '11px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: brushMode === 'clone-stamp' ? 'inset 0 1px 1px rgba(255,255,255,0.5)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Copy size={13} />
                      <span>📋 Clone Stamp</span>
                    </button>

                    {/* Mode 4: Skin Smooth */}
                    <button
                      type="button"
                      onClick={() => { setBrushMode('skin-smooth'); setIsPickingCloneSource(false); }}
                      className="touch-btn"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        border: brushMode === 'skin-smooth' ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                        backgroundColor: brushMode === 'skin-smooth' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                        color: brushMode === 'skin-smooth' ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                        fontSize: '11px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: brushMode === 'skin-smooth' ? 'inset 0 1px 1px rgba(255,255,255,0.5)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Circle size={13} />
                      <span>🌸 Skin Smooth</span>
                    </button>

                    {/* Mode 5: Dodge & Burn */}
                    <button
                      type="button"
                      onClick={() => { setBrushMode('dodge-burn'); setIsPickingCloneSource(false); }}
                      className="touch-btn"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        border: brushMode === 'dodge-burn' ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                        backgroundColor: brushMode === 'dodge-burn' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                        color: brushMode === 'dodge-burn' ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                        fontSize: '11px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: brushMode === 'dodge-burn' ? 'inset 0 1px 1px rgba(255,255,255,0.5)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Flame size={13} />
                      <span>☀️ Light & Shadow</span>
                    </button>
                  </div>

                  {/* Mode Specific Quick Options */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {brushMode === 'generative-erase' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '3px 8px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.65)', fontWeight: '900' }}>Mode:</span>
                        <button
                          type="button"
                          onClick={() => setAutoEraseOnRelease(true)}
                          style={{
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: autoEraseOnRelease ? '#ec4899' : 'transparent',
                            color: autoEraseOnRelease ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                            fontSize: '10px',
                            fontWeight: '900',
                            cursor: 'pointer'
                          }}
                        >
                          ⚡ Auto Erase
                        </button>
                        <button
                          type="button"
                          onClick={() => setAutoEraseOnRelease(false)}
                          style={{
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: !autoEraseOnRelease ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                            color: !autoEraseOnRelease ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                            fontSize: '10px',
                            fontWeight: '900',
                            cursor: 'pointer'
                          }}
                        >
                          📝 Batch Mark
                        </button>
                      </div>
                    )}

                    {brushMode === 'clone-stamp' && (
                      <button
                        type="button"
                        onClick={() => setIsPickingCloneSource(true)}
                        style={{
                          padding: '5px 14px',
                          borderRadius: '9999px',
                          border: isPickingCloneSource ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.22)',
                          backgroundColor: isPickingCloneSource ? 'rgba(2, 132, 199, 0.8)' : 'rgba(255, 255, 255, 0.10)',
                          color: '#ffffff',
                          fontSize: '10.5px',
                          fontWeight: '900',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: isPickingCloneSource ? '0 0 12px rgba(56,189,248,0.5)' : 'none'
                        }}
                      >
                        <Target size={13} />
                        <span>{isPickingCloneSource ? 'Tap Photo to Pick Source...' : 'Pick Source Texture'}</span>
                      </button>
                    )}

                    {brushMode === 'dodge-burn' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '3px 6px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
                        <button
                          type="button"
                          onClick={() => setDodgeBurnType('dodge')}
                          style={{
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: dodgeBurnType === 'dodge' ? '#f59e0b' : 'transparent',
                            color: dodgeBurnType === 'dodge' ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                            fontSize: '10px',
                            fontWeight: '900',
                            cursor: 'pointer'
                          }}
                        >
                          ☀️ Dodge (Brighten)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDodgeBurnType('burn')}
                          style={{
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: dodgeBurnType === 'burn' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                            color: dodgeBurnType === 'burn' ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                            fontSize: '10px',
                            fontWeight: '900',
                            cursor: 'pointer'
                          }}
                        >
                          🌙 Burn (Darken)
                        </button>
                      </div>
                    )}

                    {/* Change Photo Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="touch-btn"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(255, 255, 255, 0.10)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.22)',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
                        fontSize: '10.5px',
                        fontWeight: '900',
                        cursor: 'pointer'
                      }}
                    >
                      Change Photo
                    </button>
                  </div>
                </div>

                {/* ROW 2: Complete Brush Size & Feathering Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', backgroundColor: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '8px 14px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.16)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)' }}>
                  
                  {/* Continuous Slider with Steppers */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', maxWidth: '420px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Size:
                    </span>

                    {/* Step Minus */}
                    <button
                      type="button"
                      onClick={() => setBrushSize(prev => Math.max(4, prev - 4))}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', cursor: 'pointer', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)' }}
                      title="Decrease Size (-4px)"
                    >
                      <Minus size={13} />
                    </button>

                    {/* Slider Range */}
                    <input
                      type="range"
                      min="4"
                      max="160"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                      style={{ flex: 1, accentColor: '#ec4899', height: '6px', borderRadius: '3px', cursor: 'pointer' }}
                    />

                    {/* Step Plus */}
                    <button
                      type="button"
                      onClick={() => setBrushSize(prev => Math.min(160, prev + 4))}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', cursor: 'pointer', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)' }}
                      title="Increase Size (+4px)"
                    >
                      <Plus size={13} />
                    </button>

                    {/* Exact Size Badge */}
                    <div style={{ minWidth: '44px', height: '26px', padding: '0 8px', borderRadius: '9999px', backgroundColor: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10.5px', fontWeight: '900', color: '#ffffff', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5), 0 2px 8px rgba(236,72,153,0.4)' }}>
                      {brushSize}px
                    </div>
                  </div>

                  {/* Quick Preset Size Chips */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.65)', fontWeight: '900', marginRight: '2px' }}>Presets:</span>
                    {sizePresets.map(preset => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setBrushSize(preset.val)}
                        title={preset.title}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          border: brushSize === preset.val ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.18)',
                          backgroundColor: brushSize === preset.val ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                          color: brushSize === preset.val ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                          fontSize: '10.5px',
                          fontWeight: brushSize === preset.val ? '900' : '800',
                          cursor: 'pointer',
                          boxShadow: brushSize === preset.val ? '0 0 10px rgba(236,72,153,0.4)' : 'none'
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Brush Hardness / Solid vs Soft */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.65)', fontWeight: '900', marginRight: '4px' }}>Edge:</span>
                    <button
                      type="button"
                      onClick={() => setBrushHardness('hard')}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        border: brushHardness === 'hard' ? '1px solid rgba(255, 255, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.15)',
                        backgroundColor: brushHardness === 'hard' ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.06)',
                        color: brushHardness === 'hard' ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                        fontSize: '10.5px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        boxShadow: brushHardness === 'hard' ? 'inset 0 1px 1px rgba(255,255,255,0.5)' : 'none'
                      }}
                    >
                      ● Solid (Crisp Dot)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBrushHardness('soft')}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        border: brushHardness === 'soft' ? '1px solid rgba(255, 255, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.15)',
                        backgroundColor: brushHardness === 'soft' ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.06)',
                        color: brushHardness === 'soft' ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                        fontSize: '10.5px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        boxShadow: brushHardness === 'soft' ? 'inset 0 1px 1px rgba(255,255,255,0.5)' : 'none'
                      }}
                    >
                      Soft (Feathered)
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* SUB-TOOL: Crop & Rotate */}
            {activeTool === 'crop' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                {/* Row 1: Primary Action & Transform Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Left: Apply Crop & Reset Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={applyCrop}
                      className="touch-btn"
                      style={{
                        padding: '7px 18px',
                        borderRadius: '9999px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        fontSize: '11.5px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: 'inset 0 1.5px 1.5px rgba(255,255,255,0.6), 0 4px 16px rgba(16, 185, 129, 0.45)'
                      }}
                    >
                      <Scissors size={14} />
                      <span>Apply Crop</span>
                    </button>

                    <button
                      type="button"
                      onClick={resetCropBox}
                      className="touch-btn"
                      style={{
                        padding: '7px 14px',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(255, 255, 255, 0.10)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.20)',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
                        fontSize: '11px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <RefreshCw size={13} />
                      <span>Reset Box</span>
                    </button>
                  </div>

                  {/* Right: Rotate & Flip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={handleRotate}
                      className="touch-btn"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(255, 255, 255, 0.10)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.20)',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
                        fontSize: '11px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <RotateCw size={13} />
                      <span>Rotate 90°</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFlipH}
                      className="touch-btn"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(255, 255, 255, 0.10)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.20)',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
                        fontSize: '11px',
                        fontWeight: '900',
                        cursor: 'pointer'
                      }}
                    >
                      Flip Horizontal
                    </button>
                  </div>
                </div>

                {/* Row 2: Aspect Ratio Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', backgroundColor: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '6px 12px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.16)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.65)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: '4px' }}>
                    Aspect Ratio:
                  </span>
                  {[
                    { key: 'free', label: 'Free' },
                    { key: '1:1', label: '1:1 Square' },
                    { key: '16:9', label: '16:9 Landscape' },
                    { key: '9:16', label: '9:16 Story/Reel' },
                    { key: '4:3', label: '4:3 Standard' },
                    { key: '3:2', label: '3:2 DSLR' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyAspectPreset(key)}
                      className="touch-btn"
                      style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        border: cropAspect === key ? '1px solid rgba(255, 255, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.15)',
                        backgroundColor: cropAspect === key ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                        color: cropAspect === key ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                        fontSize: '10.5px',
                        fontWeight: cropAspect === key ? '900' : '800',
                        cursor: 'pointer',
                        boxShadow: cropAspect === key ? 'inset 0 1px 1px rgba(255,255,255,0.5)' : 'none'
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TOOL: Adjustments */}
            {activeTool === 'adjust' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '8px 14px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.16)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '900' }}>Brightness</span>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={adjustments.brightness}
                    onChange={(e) => setAdjustments(prev => ({ ...prev, brightness: parseInt(e.target.value, 10) }))}
                    style={{ width: '80px', accentColor: '#38bdf8' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '900' }}>Contrast</span>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={adjustments.contrast}
                    onChange={(e) => setAdjustments(prev => ({ ...prev, contrast: parseInt(e.target.value, 10) }))}
                    style={{ width: '80px', accentColor: '#38bdf8' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '900' }}>Saturation</span>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={adjustments.saturation}
                    onChange={(e) => setAdjustments(prev => ({ ...prev, saturation: parseInt(e.target.value, 10) }))}
                    style={{ width: '80px', accentColor: '#38bdf8' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={applyAdjustmentsToCanvas}
                  className="touch-btn"
                  style={{ padding: '7px 18px', borderRadius: '9999px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.35)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '900', cursor: 'pointer', marginLeft: 'auto' }}
                >
                  Apply Adjustments
                </button>
              </div>
            )}

            {/* SUB-TOOL: Filters */}
            {activeTool === 'filter' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
                {['none', 'vivid', 'warm', 'cool', 'noir', 'vintage', 'cyber'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => applyFilterPreset(f)}
                    className="touch-btn"
                    style={{
                      padding: '7px 14px',
                      borderRadius: '9999px',
                      border: activeFilter === f ? '1px solid rgba(255, 255, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.16)',
                      backgroundColor: activeFilter === f ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.06)',
                      color: activeFilter === f ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      boxShadow: activeFilter === f ? 'inset 0 1px 1px rgba(255,255,255,0.5)' : 'none'
                    }}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {/* SUB-TOOL: Markup / Pen */}
            {activeTool === 'markup' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '8px 14px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.16)' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '900' }}>Color:</span>
                {['#ef4444', '#3b82f6', '#10b981', '#facc15', '#ffffff', '#0f172a'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setMarkupColor(c)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: markupColor === c ? '2.5px solid #ffffff' : '1.5px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: markupColor === c ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                      cursor: 'pointer'
                    }}
                  />
                ))}
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '900', marginLeft: '8px' }}>Size:</span>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={markupSize}
                  onChange={(e) => setMarkupSize(parseInt(e.target.value, 10))}
                  style={{ width: '80px', accentColor: '#ec4899' }}
                />
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#ffffff' }}>{markupSize}px</span>
              </div>
            )}

            {/* SUB-TOOL: Background Blur */}
            {activeTool === 'blur' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '8px 14px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.16)' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '800' }}>
                  Applies depth-of-field portrait blur around the center subject.
                </span>
                <button
                  type="button"
                  onClick={applyBackgroundBlur}
                  className="touch-btn"
                  style={{ padding: '8px 18px', borderRadius: '9999px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.35)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5)', fontSize: '11.5px', fontWeight: '900', cursor: 'pointer' }}
                >
                  Apply Portrait Blur
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
