import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Eraser, RotateCcw, Trash2, Check, FileText, Activity } from 'lucide-react';

export default function CanvasDrawingPad({ onSave, initialData }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#0f172a');
  const [lineWidth, setLineWidth] = useState(2);
  const [isEraser, setIsEraser] = useState(false);
  const [template, setTemplate] = useState('ruled'); // 'blank', 'ruled', 'body_map'
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = 360 * 2;
    ctx.scale(2, 2);

    redrawBackground(ctx, template);

    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, 360);
      };
      img.src = initialData;
    }
  }, [template]);

  const redrawBackground = (ctx, currentTemplate) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width / 2;
    const h = canvas.height / 2;

    // Paper background
    ctx.fillStyle = '#fefdfa'; // warm clinical paper
    ctx.fillRect(0, 0, w, h);

    if (currentTemplate === 'ruled') {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let y = 30; y < h; y += 26) {
        ctx.beginPath();
        ctx.moveTo(15, y);
        ctx.lineTo(w - 15, y);
        ctx.stroke();
      }
      // Red clinical margin line
      ctx.strokeStyle = '#fca5a5';
      ctx.beginPath();
      ctx.moveTo(50, 0);
      ctx.lineTo(50, h);
      ctx.stroke();
    } else if (currentTemplate === 'body_map') {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      // Simple anatomical outline placeholder
      ctx.strokeRect(w / 2 - 40, 40, 80, 100); // torso
      ctx.beginPath();
      ctx.arc(w / 2, 25, 15, 0, Math.PI * 2); // head
      ctx.stroke();
      // Arms and legs
      ctx.strokeRect(w / 2 - 80, 50, 35, 120); // left arm
      ctx.strokeRect(w / 2 + 45, 50, 35, 120); // right arm
      ctx.strokeRect(w / 2 - 35, 145, 30, 150); // left leg
      ctx.strokeRect(w / 2 + 5, 145, 30, 150); // right leg
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('ANATOMICAL MARKING CHART (ANTERIOR)', w / 2 - 100, 320);
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    saveState();

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#fefdfa' : color;
    ctx.lineWidth = isEraser ? 16 : lineWidth;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (onSave) {
      const canvas = canvasRef.current;
      onSave(canvas.toDataURL());
    }
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setHistory(prev => [...prev.slice(-10), canvas.toDataURL()]);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, rect.width, 360);
      ctx.drawImage(img, 0, 0, rect.width, 360);
      if (onSave) onSave(canvas.toDataURL());
    };
    img.src = previous;
  };

  const clearCanvas = () => {
    saveState();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    redrawBackground(ctx, template);
    if (onSave) onSave(null);
  };

  return (
    <div className="border border-[#262626] rounded-md overflow-hidden bg-[#111111]">
      {/* Canvas Toolbar */}
      <div className="bg-[#161616] border-b border-[#262626] p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-teal-400" />
            Digital Pen & Paper Pad
          </span>
          
          <div className="h-4 w-[1px] bg-[#333333] mx-1"></div>

          {/* Color palette */}
          <div className="flex items-center gap-1">
            {[
              { label: 'Black Ink', val: '#0f172a', bg: 'bg-slate-900' },
              { label: 'Blue Medical Pen', val: '#1e40af', bg: 'bg-blue-700' },
              { label: 'Red Clinical Flag', val: '#b91c1c', bg: 'bg-rose-700' },
              { label: 'Green Normal', val: '#047857', bg: 'bg-emerald-700' }
            ].map((c) => (
              <button
                key={c.val}
                type="button"
                onClick={() => { setColor(c.val); setIsEraser(false); }}
                title={c.label}
                className={`w-5 h-5 rounded-full ${c.bg} border-2 transition-all ${
                  !isEraser && color === c.val ? 'border-white scale-110 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              />
            ))}
          </div>

          <div className="h-4 w-[1px] bg-[#333333] mx-1"></div>

          {/* Stroke Width */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <button
              type="button"
              onClick={() => { setLineWidth(1.5); setIsEraser(false); }}
              className={`px-2 py-0.5 rounded ${lineWidth === 1.5 && !isEraser ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'hover:text-white'}`}
            >
              Fine (1.5px)
            </button>
            <button
              type="button"
              onClick={() => { setLineWidth(3); setIsEraser(false); }}
              className={`px-2 py-0.5 rounded ${lineWidth === 3 && !isEraser ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'hover:text-white'}`}
            >
              Medium (3px)
            </button>
            <button
              type="button"
              onClick={() => setIsEraser(true)}
              className={`px-2 py-0.5 rounded flex items-center gap-1 ${isEraser ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'hover:text-white'}`}
            >
              <Eraser className="w-3 h-3" />
              Eraser
            </button>
          </div>
        </div>

        {/* Paper template selection & controls */}
        <div className="flex items-center gap-2">
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="bg-[#0a0a0a] border border-[#262626] rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-teal-500"
          >
            <option value="ruled">Ruled Paper Lines</option>
            <option value="blank">Blank White Sheet</option>
            <option value="body_map">Anatomical Body Chart</option>
          </select>

          <button
            type="button"
            onClick={undo}
            title="Undo stroke"
            className="p-1 rounded bg-[#0a0a0a] hover:bg-[#202020] text-slate-300 border border-[#262626]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={clearCanvas}
            title="Clear all"
            className="p-1 rounded bg-[#0a0a0a] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-[#262626]"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[360px] touch-none block"
        />
        <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] font-mono text-slate-400 bg-white/80 px-2 py-0.5 rounded shadow-sm">
          Stylus / Touch / Mouse Enabled
        </div>
      </div>
    </div>
  );
}
