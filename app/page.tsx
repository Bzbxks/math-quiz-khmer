"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, XCircle, ChevronRight, ArrowLeft, Sigma, FunctionSquare, 
  Calculator, Hash, BrainCircuit, Shapes, RefreshCw, TrendingUp, X, 
  BarChart2, Home, PenTool, Trash2, Calendar
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// --- CONFIGURATION ---
const BIN_ID = "69e478ee856a6821894cac86"; 
const API_KEY = "$2a$10$ImddOP6ar2t.zDZ76l73TuaBlfAQLbIS4R/MIrbpFQJfBms4tjTce"; 
const BAC_DATE = new Date('2026-08-10T07:00:00');

// --- TYPES ---
type TopicType = 'limit' | 'derivative' | 'integral' | 'log' | 'complex' | 'probability' | 'geometry' | 'function';
type Difficulty = 'normal' | 'medium' | 'hard';
type View = 'home' | 'stats';

interface Question {
  id: string;
  topic: TopicType;
  theme: string;
  latex: string;
  options: string[];
  correctValue: string;
  correctIndex: number;
  explanation: string;
  khmerLabel: string;
  imageUrl?: string;
  isImageOnly?: boolean;
}

interface UserStats {
  totalAnswered: number;
  correctCount: number;
  topicStats: Record<TopicType, { total: number; correct: number }>;
}

interface AnswerRecord {
  q: Question;
  sel: number;
  ok: boolean;
}

// --- UTILS (True Random) ---
const rand = (min: number, max: number) => {
  // Use crypto.getRandomValues for better randomness if available, else Math.random
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return min + (array[0] % (max - min + 1));
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateUUID = () => {
  // Use crypto.randomUUID if available (secure contexts)
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback for insecure contexts or older browsers
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// --- DRAWING CANVAS COMPONENT ---
const DrawingCanvas = ({ currentTheme }: { currentTheme?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.scale(dpr, dpr);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = '#222222';
      context.lineWidth = 3;
      setCtx(context);
    }

    const savedData = localStorage.getItem('bac_scratchpad');
    if (savedData && context) {
      const img = new Image();
      img.onload = () => context.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = savedData;
    }
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    ctx?.beginPath();
    if (canvasRef.current) {
      localStorage.setItem('bac_scratchpad', canvasRef.current.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    localStorage.removeItem('bac_scratchpad');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white z-10">
        <div>
            <h3 className="font-bold text-lg font-khmer">ក្រដាសខ្នាត</h3>
            {currentTheme && <p className="text-xs text-gray-500">កំពុងគិតពី: {currentTheme}</p>}
        </div>
        <button onClick={clearCanvas} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100">
          <Trash2 size={20} />
        </button>
      </div>
      <div className="flex-1 relative bg-[#fdfbf7]" style={{ backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '100% 2rem' }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
      </div>
    </div>
  );
};

// --- CALCULATOR COMPONENT ---
const CalculatorWidget = ({ onClose }: { onClose: () => void }) => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  const handlePress = (key: string) => {
    if (key === 'C') { setInput(""); setResult(""); return; }
    if (key === 'DEL') { setInput(input.slice(0, -1)); return; }
    if (key === '=') {
      try {
        let expr = input
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/\^/g, '**')
          .replace(/π/g, 'Math.PI')
          .replace(/e/g, 'Math.E')
          .replace(/%/g, '/100')
          .replace(/sin\(/g, 'Math.sin(')
          .replace(/cos\(/g, 'Math.cos(')
          .replace(/tan\(/g, 'Math.tan(')
          .replace(/ln\(/g, 'Math.log(')
          .replace(/log\(/g, 'Math.log10(')
          .replace(/√\(/g, 'Math.sqrt(');

        // Auto-close any unclosed parentheses to prevent syntax errors
        const openCount = (expr.match(/\(/g) || []).length;
        const closeCount = (expr.match(/\)/g) || []).length;
        if (openCount > closeCount) expr += ')'.repeat(openCount - closeCount);

        // eslint-disable-next-line no-new-func
        const res = new Function(`return ${expr}`)();
        if (res === undefined || Number.isNaN(res) || !isFinite(res)) throw new Error("Invalid");
        // Format to fix floating point bugs (e.g. 0.1 + 0.2)
        setResult(parseFloat(Number(res).toPrecision(10)).toString());
      } catch (e) {
        setResult("Error");
      }
      return;
    }

    if (['sin', 'cos', 'tan', 'ln', 'log', '√'].includes(key)) {
      setInput(input + key + '(');
    } else {
      setInput(input + key);
    }
  };

  const buttons = [
    ['sin', 'cos', 'tan', 'C', 'DEL'],
    ['ln', 'log', '√', '(', ')'],
    ['7', '8', '9', '÷', '^'],
    ['4', '5', '6', '×', 'π'],
    ['1', '2', '3', '-', 'e'],
    ['0', '.', '%', '+', '=']
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white shrink-0 z-10">
        <div>
          <h3 className="font-bold text-lg font-khmer">ម៉ាស៊ីនគិតលេខ</h3>
          <p className="text-[10px] text-gray-400 font-sans uppercase tracking-widest">Scientific (Rad)</p>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 flex flex-col p-4 bg-[#F7F7F7]">
        <div className="flex flex-col justify-end items-end p-4 bg-white rounded-2xl shadow-sm border border-gray-200 mb-4 overflow-hidden h-28 md:h-32 shrink-0">
          <div className="text-lg md:text-xl text-gray-500 tracking-wider font-mono w-full text-right overflow-x-auto whitespace-nowrap scrollbar-hide mb-1">{input || "0"}</div>
          <div className="text-3xl md:text-4xl font-bold text-[#FF385C] tracking-tighter w-full text-right overflow-x-auto whitespace-nowrap scrollbar-hide">{result}</div>
        </div>
        <div className="flex-1 grid grid-cols-5 gap-2 md:gap-3 items-stretch">
          {buttons.flat().map((btn, idx) => (
            <button key={idx} onClick={() => handlePress(btn)} className={`rounded-xl font-bold text-sm md:text-lg transition-all active:scale-95 flex items-center justify-center ${btn === '=' ? 'bg-[#FF385C] text-white hover:bg-rose-600 shadow-md' : ''} ${['C', 'DEL'].includes(btn) ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : ''} ${['÷', '×', '-', '+', '^'].includes(btn) ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : ''} ${['sin', 'cos', 'tan', 'ln', 'log', '√', '(', ')', 'π', 'e'].includes(btn) ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50' : ''} ${/^[0-9.%]$/.test(btn) ? 'bg-white shadow-sm border border-gray-100 text-[#222222] hover:bg-gray-50 text-lg md:text-xl' : ''}`}>
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- MATH ENGINE (True Random) ---
const generateQuestion = (topic: TopicType, difficulty: Difficulty, completedForTopic: number[] = []): Question => {
  if (topic === 'probability' || topic === 'function') {
    const isProb = topic === 'probability';
    const maxImg = isProb ? 17 : 16;
    
    let available = [];
    for (let i = 1; i <= maxImg; i++) {
        if (!completedForTopic.includes(i)) available.push(i);
    }
    
    let imgNum = rand(1, maxImg);
    if (available.length > 0) {
        imgNum = available[rand(0, available.length - 1)];
        completedForTopic.push(imgNum); // Prevent duplicate in same generation batch
    }
    
    const imgPrefix = isProb ? '' : 'a';
    return {
      id: generateUUID(),
      topic,
      theme: isProb ? "លំហាត់ប្រូបាប" : "លំហាត់អនុគមន៍",
      latex: "",
      imageUrl: `/${imgPrefix}${imgNum}.jpg`,
      options: [],
      correctValue: "",
      correctIndex: -1,
      explanation: "",
      khmerLabel: isProb ? "ប្រូបាប (Probability)" : "អនុគមន៍ (Functions)",
      isImageOnly: true
    };
  }

  let latex = "", theme = "", explanation = "", khmerLabel = "";
  let correctVal: string = "";

  const isHard = difficulty === 'hard';
  const isMedium = difficulty === 'medium';
  const type = rand(1, 3); // Picks 1 of 3 different formula structures

  // Seed randomness with time to ensure uniqueness
  const seed = Date.now(); 

  switch (topic) {
    case 'limit':
      khmerLabel = "លិមិត (Limits)";
      if (isHard) {
        if (type === 1) {
            const a = rand(2, 6); const b = rand(2, 5);
            latex = `\\lim_{x \\to 0} \\frac{e^{${a}x} - 1}{${b}x}`;
            correctVal = (a/b).toFixed(2);
            theme = "លិមិតអិចស្ប៉ូណង់ស្យែល";
        } else if (type === 2) {
            const a = rand(2, 8); const b = rand(2, 5);
            latex = `\\lim_{x \\to 0} \\frac{1 - \\cos(${a}x)}{${b}x^2}`;
            correctVal = ((a*a)/(2*b)).toFixed(2);
            theme = "លិមិតត្រីកោណមាត្រ";
        } else {
            const a = rand(2, 9); const b = rand(1, 5); const c = rand(2, 7);
            latex = `\\lim_{x \\to \\infty} \\frac{${a}x^2 + ${b}x}{${c}x^2 - 1}`;
            correctVal = (a/c).toFixed(2);
            theme = "លិមិតនៅអានន្ត";
        }
      } else if (isMedium) {
        if (type === 1) {
            const a = rand(2, 9); const b = rand(2, 9);
            latex = `\\lim_{x \\to 0} \\frac{\\sin(${a}x)}{${b}x}`;
            correctVal = (a / b).toFixed(2);
            theme = "លិមិតត្រីកោណមាត្រ";
        } else if (type === 2) {
            const c = rand(2, 6);
            latex = `\\lim_{x \\to ${c}} \\frac{x^2 - ${c*c}}{x - ${c}}`;
            correctVal = (2*c).toFixed(2);
            theme = "លិមិតរាងសូន្យលើសូន្យ";
        } else {
            const a = rand(2, 5);
            latex = `\\lim_{x \\to 0} \\frac{\\tan(${a}x)}{x}`;
            correctVal = a.toFixed(2);
            theme = "លិមិតត្រីកោណមាត្រ";
        }
      } else {
        const a = rand(2, 9); const b = rand(1, 10); const c = rand(1, 5);
        latex = `\\lim_{x \\to ${c}} (${a}x + ${b})`;
        correctVal = (a*c + b).toFixed(2);
        theme = "លិមិតពហុធា";
      }
      break;

    case 'derivative':
      khmerLabel = "ដេរីវេ (Derivatives)";
      if (isHard) {
        if (type === 1) {
            const a = rand(2, 5); const b = rand(2, 5);
            latex = `y = e^{${a}x}\\sin(${b}x). \\quad y'(0) = ?`;
            correctVal = b.toFixed(2);
            theme = "ដេរីវេផលគុណ";
        } else if (type === 2) {
            const a = rand(2, 5); const b = rand(1, 5); const d = rand(2, 5);
            latex = `y = \\frac{${a}x+${b}}{x+${d}}. \\quad y'(0) = ?`;
            correctVal = (a/d - b/(d*d)).toFixed(2);
            theme = "ដេរីវេផលចែក";
        } else {
            const a = rand(2, 5);
            latex = `y = \\ln(x^2 + ${a}). \\quad y'(1) = ?`;
            correctVal = (2/(1+a)).toFixed(2);
            theme = "ដេរីវេអនុគមន៍បណ្តាក់";
        }
      } else if (isMedium) {
        if (type === 1) {
            const a = rand(2, 5); const n = rand(3, 5);
            latex = `y = (${a}x + 1)^{${n}}. \\quad y'(0) = ?`;
            correctVal = (n * a).toFixed(2);
            theme = "ដេរីវេនៃអនុគមន៍ស្វ័យគុណ";
        } else if (type === 2) {
            const a = rand(2, 6);
            latex = `y = \\cos(${a}x). \\quad y'(\\pi) = ?`;
            correctVal = "0.00";
            theme = "ដេរីវេត្រីកោណមាត្រ";
        } else {
            const a = rand(2, 5); const b = rand(2, 5);
            latex = `y = e^{${a}x} + ${b}x. \\quad y'(0) = ?`;
            correctVal = (a + b).toFixed(2);
            theme = "ដេរីវេអិចស្ប៉ូណង់ស្យែល";
        }
      } else {
        const n = rand(2, 5); const a = rand(2, 5); const x0 = rand(1, 3);
        latex = `y = ${a}x^{${n}}. \\quad y'(${x0}) = ?`;
        correctVal = (a * n * Math.pow(x0, n-1)).toFixed(2);
        theme = "ដេរីវេនៃពហុធា";
      }
      break;

    case 'integral':
      khmerLabel = "អាំងតេក្រាល (Integrals)";
      if (isHard) {
        if (type === 1) {
            const a = rand(2, 5);
            latex = `\\int_{0}^{1} ${a}x e^{x^2} \\, dx`;
            correctVal = ((a/2)*(Math.E - 1)).toFixed(2);
            theme = "អាំងតេក្រាលដោយជំនួស";
        } else if (type === 2) {
            const a = rand(2, 5);
            latex = `\\int_{0}^{\\pi/2} ${a}\\cos(x)\\sin(x) \\, dx`;
            correctVal = (a/2).toFixed(2);
            theme = "អាំងតេក្រាលត្រីកោណមាត្រ";
        } else {
            const a = rand(2, 4);
            latex = `\\int_{0}^{${a}} \\frac{2x}{x^2+1} \\, dx`;
            correctVal = Math.log(a*a + 1).toFixed(2);
            theme = "អាំងតេក្រាលលោការីត";
        }
      } else if (isMedium) {
        if (type === 1) {
            const k = rand(2, 5); const upper = rand(2, 4);
            latex = `\\int_{0}^{${upper}} ${k}x \\, dx`;
            correctVal = ((k * Math.pow(upper, 2))/2).toFixed(2);
            theme = "អាំងតេក្រាលនៃពហុធា";
        } else if (type === 2) {
            const a = rand(2, 4);
            latex = `\\int_{0}^{\\ln(${a})} e^x \\, dx`;
            correctVal = (a - 1).toFixed(2);
            theme = "អាំងតេក្រាលអិចស្ប៉ូណង់ស្យែល";
        } else {
            const a = rand(2, 6);
            latex = `\\int_{0}^{2} (${a}x^2 - 1) \\, dx`;
            correctVal = (a*(8/3) - 2).toFixed(2);
            theme = "អាំងតេក្រាលកំណត់";
        }
      } else {
        const k = rand(2, 9); const upper = rand(2, 5);
        latex = `\\int_{0}^{${upper}} ${k} \\, dx`;
        correctVal = (k*upper).toFixed(2);
        theme = "អាំងតេក្រាលកំណត់មូលដ្ឋាន";
      }
      break;

    case 'log':
      khmerLabel = "លោការីត (Logarithms)";
      if (isHard) {
        if (type === 1) {
            const a = rand(2, 5); const b = rand(2, 5);
            latex = `\\log_{2}(8^{${a}}) + \\log_{3}(9^{${b}})`;
            correctVal = (3*a + 2*b).toFixed(2);
            theme = "លក្ខណៈលោការីត";
        } else if (type === 2) {
            const a = rand(2, 5);
            latex = `e^{2\\ln(${a})} = ?`;
            correctVal = (a*a).toFixed(2);
            theme = "ស្វ័យគុណលោការីត";
        } else {
            const a = rand(2, 5); const b = rand(2, 4);
            latex = `\\ln(e^{${a}}) - \\log_{${b}}(1) = ?`;
            correctVal = (a).toFixed(2);
            theme = "គណនាលោការីត";
        }
      } else if (isMedium) {
        if (type === 1) {
            const base = rand(2, 5); const exp = rand(2, 4);
            latex = `\\log_{${base}}(${Math.pow(base, exp)})`;
            correctVal = exp.toFixed(2);
            theme = "និយមន័យលោការីត";
        } else if (type === 2) {
            const a = rand(2, 8);
            latex = `\\log_{10}(100) + \\ln(e^{${a}})`;
            correctVal = (2 + a).toFixed(2);
            theme = "ផលបូកលោការីត";
        } else {
            const a = rand(2, 4);
            latex = `\\log_{${a}}(${a}) + \\log_{${a}}(${a*a})`;
            correctVal = (1 + 2).toFixed(2);
            theme = "លោការីតមូលដ្ឋាន";
        }
      } else {
        const base = 10; const val = rand(1, 4);
        latex = `\\log_{${base}}(${Math.pow(10, val)})`;
        correctVal = val.toFixed(2);
        theme = "គណនាលោការីត";
      }
      break;

    case 'complex':
      khmerLabel = "កុំផ្លិច (Complex)";
      if (isHard) {
        if (type === 1) {
            const a = rand(1, 3);
            latex = `z = (${a}+i)^2. \\quad \\text{Re}(z) = ?`;
            correctVal = (a*a - 1).toFixed(2);
            theme = "ស្វ័យគុណចំនួនកុំផ្លិច";
        } else if (type === 2) {
            const a = rand(2, 4); const b = rand(1, 3);
            latex = `z = \\frac{${a}+${b}i}{i}. \\quad \\text{Im}(z) = ?`;
            correctVal = (-a).toFixed(2);
            theme = "ផលចែកចំនួនកុំផ្លិច";
        } else {
            const a = rand(1, 4);
            latex = `z = ${a} + ${a}i. \\quad |z|^2 = ?`;
            correctVal = (2*a*a).toFixed(2);
            theme = "ម៉ូឌុលការេ";
        }
      } else if (isMedium) {
        if (type === 1) {
            const a = rand(1, 5); const b = rand(1, 5);
            latex = `z = ${a} + ${b}i. \\quad |z|^2 = ?`;
            correctVal = (a*a + b*b).toFixed(2);
            theme = "គណនាម៉ូឌុល";
        } else if (type === 2) {
            const a = rand(2, 5); const b = rand(2, 5);
            latex = `z = (${a}+i) + (${b}-i). \\quad z = ?`;
            correctVal = (a+b).toFixed(2);
            theme = "ផលបូកកុំផ្លិច";
        } else {
            const a = rand(2, 5);
            latex = `z = ${a}i(2+i). \\quad \\text{Re}(z) = ?`;
            correctVal = (-a).toFixed(2);
            theme = "ផលគុណកុំផ្លិច";
        }
      } else {
        const n = rand(2, 6);
        if (n % 4 === 0) {
          latex = `i^{${n}} = ?`; correctVal = "1.00";
        } else if (n % 4 === 1) {
          latex = `i^{${n}} = ?`; correctVal = "i";
        } else if (n % 4 === 2) {
          latex = `i^{${n}} = ?`; correctVal = "-1.00";
        } else {
          latex = `i^{${n}} = ?`; correctVal = "-i";
        }
        theme = "ស្វ័យគុណនៃ i";
      }
      break;

    case 'geometry':
      khmerLabel = "ធរណីមាត្រ (Geometry)";
      if (isHard) {
        if (type === 1) {
            const r = rand(2, 5); const h = rand(2, 6);
            latex = `V_{\\text{cone}}, r=${r}, h=${h}`;
            correctVal = ((1/3)*Math.PI*r*r*h).toFixed(2);
            theme = "មាឌកោណ";
        } else if (type === 2) {
            const r = rand(2, 5);
            latex = `V_{\\text{sphere}}, r=${r}`;
            correctVal = ((4/3)*Math.PI*Math.pow(r, 3)).toFixed(2);
            theme = "មាឌស្វ៊ែរ";
        } else {
            const r = rand(2, 5); const h = rand(3, 8);
            latex = `V_{\\text{cylinder}}, r=${r}, h=${h}`;
            correctVal = (Math.PI*r*r*h).toFixed(2);
            theme = "មាឌស៊ីឡាំង";
        }
      } else if (isMedium) {
        if (type === 1) {
            const r = rand(2, 9);
            latex = `A_{\\text{circle}}, r=${r}`;
            correctVal = (Math.PI*r*r).toFixed(2);
            theme = "ក្រឡាផ្ទៃរង្វង់";
        } else if (type === 2) {
            const a = rand(3, 8); const b = rand(3, 8);
            latex = `A_{\\text{triangle}}, b=${a}, h=${b}`;
            correctVal = ((a*b)/2).toFixed(2);
            theme = "ក្រឡាផ្ទៃត្រីកោណ";
        } else {
            const r = rand(2, 7);
            latex = `C_{\\text{circle}}, r=${r}`;
            correctVal = (2*Math.PI*r).toFixed(2);
            theme = "បរិមាត្ររង្វង់";
        }
      } else {
        const a = rand(2, 9);
        latex = `V_{\\text{cube}}, a=${a}`;
        correctVal = Math.pow(a,3).toFixed(2);
        theme = "មាឌគូប";
      }
      break;
  }

  const optionsSet = new Set<string>();
  optionsSet.add(correctVal);
  
  while(optionsSet.size < 4) {
    if (["i", "-i", "1.00", "-1.00", "0.00"].includes(correctVal)) {
        const fakeOpts = ["i", "-i", "1.00", "-1.00", "0.00", "2.00", "-2.00"];
        optionsSet.add(fakeOpts[rand(0, fakeOpts.length - 1)]);
    } else {
        const num = parseFloat(correctVal);
        if (!isNaN(num)) {
            const offset = rand(-8, 8) + (rand(0, 3) * 0.25);
            let fake = (num + offset).toFixed(correctVal.includes('.') ? correctVal.split('.')[1].length : 0);
            if (rand(1, 4) === 1) fake = (num * rand(2, 4)).toFixed(correctVal.includes('.') ? correctVal.split('.')[1].length : 0); 
            if (fake !== correctVal) optionsSet.add(fake);
        } else {
            optionsSet.add(rand(1, 20).toFixed(2));
        }
    }
  }

  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
  
  return {
    id: generateUUID(),
    topic,
    theme,
    latex,
    options,
    correctValue: correctVal,
    correctIndex: options.indexOf(correctVal),
    explanation,
    khmerLabel
  };
};

const TOPICS = [
  { id: 'limit', label: 'លិមិត', sub: 'Limits', icon: Sigma, color: 'bg-blue-100 text-blue-600' },
  { id: 'derivative', label: 'ដេរីវេ', sub: 'Derivatives', icon: FunctionSquare, color: 'bg-purple-100 text-purple-600' },
  { id: 'integral', label: 'អាំងតេក្រាល', sub: 'Integrals', icon: Calculator, color: 'bg-green-100 text-green-600' },
  { id: 'log', label: 'លោការីត', sub: 'Logarithms', icon: Hash, color: 'bg-orange-100 text-orange-600' },
  { id: 'complex', label: 'កុំផ្លិច', sub: 'Complex', icon: BrainCircuit, color: 'bg-pink-100 text-pink-600' },
  { id: 'probability', label: 'ប្រូបាប', sub: 'Probability', icon: Shapes, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'function', label: 'អនុគមន៍', sub: 'Functions', icon: TrendingUp, color: 'bg-rose-100 text-rose-600', colSpan: 2 },
];

const Typewriter = ({ text, delay = 0, speed = 100, deleteSpeed = 50, pause = 2000 }: { text: string; delay?: number; speed?: number; deleteSpeed?: number; pause?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (!hasStarted) {
      timeout = setTimeout(() => setHasStarted(true), delay);
      return () => clearTimeout(timeout);
    }

    if (!isDeleting && displayedText !== text) {
      timeout = setTimeout(() => setDisplayedText(text.slice(0, displayedText.length + 1)), speed);
    } else if (!isDeleting && displayedText === text) {
      timeout = setTimeout(() => setIsDeleting(true), pause);
    } else if (isDeleting && displayedText !== "") {
      timeout = setTimeout(() => setDisplayedText(text.slice(0, displayedText.length - 1)), deleteSpeed);
    } else if (isDeleting && displayedText === "") {
      timeout = setTimeout(() => setIsDeleting(false), pause / 2);
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, hasStarted, text, speed, deleteSpeed, pause, delay]);

  return <span>{displayedText}</span>;
};

const MathDisplay = ({ latex }: { latex: string }) => {
  const html = React.useMemo(() => katex.renderToString(latex, { throwOnError: false }), [latex]);
  return (
    <div className="w-full flex justify-center overflow-hidden py-2">
      <div 
        dangerouslySetInnerHTML={{ __html: html }} 
        className="text-[#222222] font-serif origin-center transform transition-transform duration-300"
        style={{ fontSize: 'clamp(1.2rem, 6vw, 2.5rem)', maxWidth: '100%', lineHeight: 1.4 }} 
      />
    </div>
  );
};

export default function MathQuizApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'review'>('menu');
  const [currentView, setCurrentView] = useState<View>('home');
  
  // Game State
  const [selectedTopic, setSelectedTopic] = useState<TopicType | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<AnswerRecord[]>([]);
  
  // UI State
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showTopicDetail, setShowTopicDetail] = useState<TopicType | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState("...");
  
  // Data State
  const [stats, setStats] = useState<UserStats>({
    totalAnswered: 0,
    correctCount: 0,
    topicStats: {} as Record<TopicType, { total: number; correct: number }>
  });
  const [completedImages, setCompletedImages] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const savedStats = localStorage.getItem('bac_math_stats');
    if (savedStats) setStats(JSON.parse(savedStats));
    
    const savedCompleted = localStorage.getItem('bac_math_completed_images');
    if (savedCompleted) {
        try { setCompletedImages(JSON.parse(savedCompleted)); } catch (e) {}
    }
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = BAC_DATE.getTime() - now;
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      setTimeLeft(`${days} ថ្ងៃ`);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000 * 60 * 60);
    return () => clearInterval(timer);
  }, []);

  const handleEnterApp = () => setIsLoading(false);

  const saveStatsLocal = (newStats: UserStats) => {
    setStats(newStats);
    localStorage.setItem('bac_math_stats', JSON.stringify(newStats));
  };

  const handleStartGame = (difficulty: Difficulty, overrideTopic?: TopicType) => {
    const topicToUse = overrideTopic || selectedTopic;
    if (!topicToUse) return;
    setSelectedDifficulty(difficulty);
    if (overrideTopic) setSelectedTopic(overrideTopic);
    setShowLevelModal(false);
    
    let localCompleted = [...(completedImages[topicToUse] || [])];
    const maxImg = topicToUse === 'probability' ? 17 : (topicToUse === 'function' ? 16 : 0);
    
    if (maxImg > 0 && localCompleted.length >= maxImg) {
        localCompleted = [];
        setCompletedImages(prev => {
            const newCompleted = { ...prev, [topicToUse]: [] };
            localStorage.setItem('bac_math_completed_images', JSON.stringify(newCompleted));
            return newCompleted;
        });
    }

    const rawQs = [];
    let numQuestions = 10;
    if (maxImg > 0) {
        const remaining = maxImg - localCompleted.length;
        numQuestions = Math.min(10, remaining > 0 ? remaining : 10);
    }

    for (let i = 0; i < numQuestions; i++) {
        rawQs.push(generateQuestion(topicToUse, difficulty, localCompleted));
    }
    
    setQuestions([...rawQs]); // Spread operator ensures new reference
    setCurrentIndex(0);
    setScore(0);
    setUserAnswers([]);
    setGameState('playing');
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correctIndex;
    if (isCorrect) setScore(s => s + 1);
    setUserAnswers(prev => [...prev, { q: currentQ, sel: selectedOption, ok: isCorrect }]);
    setIsAnswered(true);

    const newStats = { ...stats };
    if (!newStats.topicStats) newStats.topicStats = {} as Record<TopicType, { total: number; correct: number }>;
    const topic = currentQ.topic;
    newStats.totalAnswered++;
    if (isCorrect) newStats.correctCount++;
    if (!newStats.topicStats[topic]) newStats.topicStats[topic] = { total: 0, correct: 0 };
    newStats.topicStats[topic].total++;
    if (isCorrect) newStats.topicStats[topic].correct++;
    saveStatsLocal(newStats);
  };

  const handleImageQuestionDone = () => {
    const currentQ = questions[currentIndex];
    
    if (currentQ.topic && currentQ.imageUrl) {
        const imgNumMatch = currentQ.imageUrl.match(/\d+/);
        if (imgNumMatch) {
            const imgNum = parseInt(imgNumMatch[0], 10);
            setCompletedImages(prev => {
                const topicCompleted = prev[currentQ.topic] || [];
                if (!topicCompleted.includes(imgNum)) {
                    const newCompleted = {
                        ...prev,
                        [currentQ.topic]: [...topicCompleted, imgNum]
                    };
                    localStorage.setItem('bac_math_completed_images', JSON.stringify(newCompleted));
                    return newCompleted;
                }
                return prev;
            });
        }
    }

    // Implicitly count image-only questions as correct in score
    setScore(s => s + 1);

    const newStats = { ...stats };
    if (!newStats.topicStats) newStats.topicStats = {} as Record<TopicType, { total: number; correct: number }>;
    const topic = currentQ.topic;
    newStats.totalAnswered++;
    newStats.correctCount++;
    if (!newStats.topicStats[topic]) newStats.topicStats[topic] = { total: 0, correct: 0 };
    newStats.topicStats[topic].total++;
    newStats.topicStats[topic].correct++;
    saveStatsLocal(newStats);

    setUserAnswers(prev => [...prev, { q: currentQ, sel: -1, ok: true }]);
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(p => p + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      if (questions[0]?.isImageOnly) {
        setShowCompletionModal(true);
      } else {
        setGameState('review');
      }
    }
  };

  // Calculation for remaining images indicator
  const currentTopic = questions[currentIndex]?.topic;
  const isImageTopic = currentTopic === 'probability' || currentTopic === 'function';
  const maxImages = currentTopic === 'probability' ? 17 : (currentTopic === 'function' ? 16 : 0);
  const completedCount = completedImages[currentTopic as string]?.length || 0;
  const remainingImages = maxImages - completedCount;

  // --- RENDER CONTENT BASED ON VIEW ---
  const renderContent = () => {
    if (gameState !== 'menu') return null;

    return (
      <AnimatePresence mode="wait">
        {currentView === 'home' && (
          <motion.main 
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 px-6 py-6 md:py-12 max-w-md md:max-w-5xl mx-auto w-full overflow-y-auto flex flex-col"
          >
            <div>
              <div className="hidden md:flex bg-gradient-to-r from-[#FF385C] to-[#BD1E59] rounded-[2rem] p-8 lg:p-10 mb-10 text-white shadow-xl items-center justify-between relative overflow-hidden">
                <div className="absolute -top-10 -right-10 p-8 opacity-10 pointer-events-none">
                  <Shapes size={240} />
                </div>
                <div className="relative z-10">
                  <h2 className="text-3xl lg:text-4xl font-black mb-3 font-khmerHeading">ត្រៀមប្រឡងបាក់ឌុប ២០២៦</h2>
                  <p className="text-white/90 max-w-md text-sm lg:text-base leading-relaxed min-h-[44px]">
                    <Typewriter text="អនុវត្តលំហាត់គណិតវិទ្យាដោយឥតគិតថ្លៃ ជាមួយនឹងការពន្យល់លម្អិត ។" speed={80} deleteSpeed={30} pause={3000} />
                    <motion.span 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: [0, 1, 0] }} 
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="inline-block w-1.5 h-4 lg:h-5 bg-white/80 ml-1 align-middle"
                    />
                  </p>
                </div>
                <div className="hidden lg:flex gap-4 relative z-10">
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 text-center min-w-[120px] shadow-sm border border-white/20">
                    <div className="text-3xl font-black">{stats.totalAnswered}</div>
                    <div className="text-xs uppercase tracking-wider opacity-90 mt-1 font-medium">សំណួរសរុប</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 text-center min-w-[120px] shadow-sm border border-white/20">
                    <div className="text-3xl font-black">{stats.totalAnswered > 0 ? Math.round((stats.correctCount / stats.totalAnswered) * 100) : 0}%</div>
                    <div className="text-xs uppercase tracking-wider opacity-90 mt-1 font-medium">ភាពត្រឹមត្រូវ</div>
                  </div>
                </div>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-[#222222] mb-4 md:mb-6">ប្រភេទលំហាត់</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {TOPICS.map((t) => (
                  <motion.button 
                    key={t.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (t.id === 'probability' || t.id === 'function') {
                        handleStartGame('normal', t.id as TopicType);
                      } else {
                        setSelectedTopic(t.id as TopicType);
                        setShowLevelModal(true);
                      }
                    }}
                    className={`relative z-10 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer ${t.colSpan === 2 ? 'col-span-2' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${t.color} group-hover:scale-110 transition-transform duration-300`}>
                      <t.icon size={24} />
                    </div>
                    <span className="font-bold text-[#222222] text-sm">{t.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-8 pb-2 text-center text-sm text-gray-400 md:hidden">
              <p className="font-medium flex items-center justify-center min-h-[20px]">
                <Typewriter text="Developed by JJ 🇰🇭 Cambodia" speed={100} delay={500} />
                <motion.span 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: [0, 1, 0] }} 
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-1 h-3.5 bg-gray-400 ml-1"
                />
              </p>
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.5, duration: 0.8 }}
                className="mt-1 min-h-[20px]"
              >
                Telegram: <a href="https://t.me/jj_jame" target="_blank" rel="noopener noreferrer" className="text-[#FF385C] hover:underline font-medium">@jj_jame</a>
              </motion.p>
            </div>
          </motion.main>
        )}

        {currentView === 'stats' && (
          <motion.main 
            key="stats"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 px-6 py-6 md:py-12 max-w-md md:max-w-5xl mx-auto w-full overflow-y-auto pb-24 md:pb-10"
          >
            <div className="md:grid md:grid-cols-[1fr_2fr] md:gap-8 items-stretch w-full min-h-[calc(100vh-8rem)]">
              <div className="bg-[#222222] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden mb-6 md:mb-0 flex flex-col h-full">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><BarChart2 size={160} /></div>
                  
                  <div className="relative z-10 flex-1 flex flex-col">
                      <h3 className="text-gray-400 text-sm uppercase tracking-widest font-bold mb-6 text-center md:text-left">ទិដ្ឋភាពទូទៅ</h3>
                      
                      <div className="text-center mb-8 flex flex-col items-center">
                          <div className="relative inline-flex items-center justify-center mb-4">
                              <svg className="w-32 h-32 md:w-44 md:h-44 transform -rotate-90">
                                  <circle cx="50%" cy="50%" r="40%" className="stroke-gray-800" strokeWidth="12" fill="none" />
                                  <circle cx="50%" cy="50%" r="40%" className="stroke-[#FF385C] transition-all duration-1000 ease-out" strokeWidth="12" fill="none" strokeDasharray="100" strokeDashoffset={100 - (stats.totalAnswered > 0 ? Math.round((stats.correctCount / stats.totalAnswered) * 100) : 0)} strokeLinecap="round" pathLength="100" />
                              </svg>
                              <div className="absolute flex flex-col items-center justify-center">
                                  <span className="text-4xl md:text-5xl font-black">{stats.totalAnswered > 0 ? Math.round((stats.correctCount / stats.totalAnswered) * 100) : 0}%</span>
                              </div>
                          </div>
                          <p className="text-gray-300 font-medium text-lg">ភាពត្រឹមត្រូវសរុប</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="bg-white/5 rounded-2xl p-5 text-center border border-white/10 backdrop-blur-sm">
                              <div className="text-3xl font-bold text-white mb-1">{stats.totalAnswered}</div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">សំណួរ</div>
                          </div>
                          <div className="bg-white/5 rounded-2xl p-5 text-center border border-white/10 backdrop-blur-sm">
                              <div className="text-3xl font-bold text-[#38ef7d] mb-1">{stats.correctCount}</div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">ត្រូវ</div>
                          </div>
                      </div>

                      <div className="mt-auto pt-6 border-t border-white/10 hidden md:block space-y-5">
                          <h4 className="text-xs text-gray-500 uppercase tracking-widest font-bold">ចំណុចលេចធ្លោ</h4>
                          
                          <div className="bg-gradient-to-r from-green-500/10 to-transparent rounded-xl p-4 border border-green-500/20 flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                                  <TrendingUp size={24} />
                              </div>
                              <div>
                                  <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">ធ្វើបានល្អបំផុត</div>
                                  <div className="font-bold text-base text-white">
                                      {(() => {
                                          let best: string | null = null;
                                          let bestRate = -1;
                                          Object.entries(stats.topicStats).forEach(([topic, data]) => {
                                              // Prefer topics with at least 3 attempts for accurate representation
                                              if (data.total >= 3) {
                                                  const rate = data.correct / data.total;
                                                  if (rate > bestRate) {
                                                      bestRate = rate;
                                                      best = topic;
                                                  }
                                              }
                                          });
                                          if (!best) {
                                              // Fallback if they haven't done enough questions yet
                                              Object.entries(stats.topicStats).forEach(([topic, data]) => {
                                                  if (data.total > 0) {
                                                      const rate = data.correct / data.total;
                                                      if (rate > bestRate) {
                                                          bestRate = rate;
                                                          best = topic;
                                                      }
                                                  }
                                              });
                                          }
                                          return best ? TOPICS.find(t => t.id === best)?.label : 'មិនទាន់មាន';
                                      })()}
                                  </div>
                              </div>
                          </div>

                          <div className="bg-gradient-to-r from-red-500/10 to-transparent rounded-xl p-4 border border-red-500/20 flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                                  <TrendingUp size={24} className="transform rotate-180" />
                              </div>
                              <div>
                                  <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">ត្រូវខិតខំបន្ថែម</div>
                                  <div className="font-bold text-base text-white">
                                      {(() => {
                                          let worst: string | null = null;
                                          let worstRate = 101;
                                          Object.entries(stats.topicStats).forEach(([topic, data]) => {
                                              if (data.total >= 3) {
                                                  const rate = data.correct / data.total;
                                                  if (rate < worstRate) {
                                                      worstRate = rate;
                                                      worst = topic;
                                                  }
                                              }
                                          });
                                          if (!worst) {
                                              Object.entries(stats.topicStats).forEach(([topic, data]) => {
                                                  if (data.total > 0) {
                                                      const rate = data.correct / data.total;
                                                      if (rate < worstRate) {
                                                          worstRate = rate;
                                                          worst = topic;
                                                      }
                                                  }
                                              });
                                          }
                                          return worst ? TOPICS.find(t => t.id === worst)?.label : 'មិនទាន់មាន';
                                      })()}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="w-full">
                  <h3 className="font-bold text-lg md:text-2xl mb-4 md:mb-6 text-[#222222]">សមត្ថភាពតាមមេរៀន</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {Object.entries(stats.topicStats).map(([topicStr, data]) => {
                          const topic = topicStr as TopicType;
                          const tAcc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                          const topicInfo = TOPICS.find(t => t.id === topic);
                          if(!topicInfo) return null;
                          return (
                            <motion.div 
                              key={topic} 
                              onClick={() => setShowTopicDetail(topic as TopicType)}
                              whileTap={{ scale: 0.98 }}
                              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer"
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${topicInfo.color}`}>
                                <topicInfo.icon size={20} />
                              </div>
                              <div className="flex-1">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-[#222222] text-sm">{topicInfo.label}</span>
                                    <span className={`text-xs font-bold ${tAcc > 70 ? 'text-green-600' : 'text-orange-500'}`}>{tAcc}%</span>
                                  </div>
                                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${tAcc > 70 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${tAcc}%` }}></div>
                                  </div>
                              </div>
                              <ChevronRight size={16} className="text-gray-400" />
                            </motion.div>
                          )
                      })}
                      {stats.totalAnswered === 0 && <p className="text-center text-gray-400 py-8">មិនទាន់មានទិន្នន័យ។</p>}
                  </div>
              </div>
              </div>
          </motion.main>
        )}
      </AnimatePresence>
    );
  };

  // --- MAIN RENDER ---
  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="fixed inset-0 bg-[#FF385C] z-50 flex flex-col items-center justify-center cursor-pointer"
        style={{ height: '100dvh' }}
        onClick={handleEnterApp}
      >
        <div className="w-32 h-32 rounded-[28px] flex items-center justify-center mb-8 overflow-hidden">
           <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => {
             (e.target as HTMLImageElement).style.display = 'none';
             (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF385C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
           }} />
        </div>
        <h1 className="text-4xl font-bold text-white font-khmerHeading mb-2">សូមស្វាគមន៍</h1>
        <p className="text-white/80 font-khmer animate-pulse">ចុចដើម្បីចាប់ផ្តើម</p>
      </motion.div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#F7F7F7] flex flex-col md:flex-row font-khmer overflow-hidden">
      
      {/* DESKTOP SIDEBAR */}
      {gameState === 'menu' && (
        <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 z-30 shrink-0 p-8 shadow-sm">
          <div className="mb-10">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF385C] to-[#BD1E59] font-sans tracking-tight">BACLL-26</h1>
            <p className="text-sm text-gray-500 font-medium">Developed by JJ</p>
          </div>
          <nav className="flex flex-col gap-3">
            <button onClick={() => setCurrentView('home')} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-colors ${currentView === 'home' ? 'bg-rose-50 text-[#FF385C]' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Home size={22} strokeWidth={currentView === 'home' ? 2.5 : 2} />
              <span className="font-bold text-base">ទំព័រដើម</span>
            </button>
            <button onClick={() => setCurrentView('stats')} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-colors ${currentView === 'stats' ? 'bg-rose-50 text-[#FF385C]' : 'text-gray-500 hover:bg-gray-50'}`}>
              <BarChart2 size={22} strokeWidth={currentView === 'stats' ? 2.5 : 2} />
              <span className="font-bold text-base">សមត្ថភាព</span>
            </button>
          </nav>
          <div className="mt-auto">
             <div className="bg-rose-50 p-5 rounded-3xl border border-rose-100 flex flex-col items-center gap-3">
              <Calendar size={28} className="text-[#FF385C]" />
              <div className="text-center">
                <span className="text-sm font-bold text-[#FF385C] opacity-80">ប្រឡងបាក់ឌុបក្នុងពេល</span>
                <div className="text-2xl font-black text-[#FF385C] mt-1">{timeLeft}</div>
              </div>
            </div>
            <div className="mt-6 text-center text-xs text-gray-400">
              Telegram: <a href="https://t.me/jj_jame" target="_blank" rel="noopener noreferrer" className="text-[#FF385C] hover:underline font-medium">@jj_jame</a>
            </div>
          </div>
        </aside>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* MOBILE HEADER */}
        {gameState === 'menu' && (
          <header className="md:hidden bg-white px-6 py-6 shadow-sm z-20 shrink-0">
            <div className="max-w-md mx-auto flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF385C] to-[#BD1E59] font-sans tracking-tight">BACLL-26</h1>
                <p className="text-xs text-gray-500 font-medium">Developed by JJ</p>
              </div>
              <div className="bg-red-50 px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-2">
                <Calendar size={14} className="text-[#FF385C]" />
                <span className="text-xs font-bold text-[#FF385C]">{timeLeft}</span>
              </div>
            </div>
          </header>
        )}

      {renderContent()}

      {/* MOBILE BOTTOM NAV */}
      {gameState === 'menu' && (
        <div className="md:hidden bg-white border-t border-gray-100 pb-6 pt-3 px-6 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] shrink-0">
          <div className="max-w-md mx-auto flex justify-around items-center">
            <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 ${currentView === 'home' ? 'text-[#FF385C]' : 'text-gray-400'}`}>
              <Home size={24} strokeWidth={currentView === 'home' ? 2.5 : 2} />
              <span className="text-[10px] font-bold">ទំព័រដើម</span>
            </button>
            <button onClick={() => setCurrentView('stats')} className={`flex flex-col items-center gap-1 ${currentView === 'stats' ? 'text-[#FF385C]' : 'text-gray-400'}`}>
              <BarChart2 size={24} strokeWidth={currentView === 'stats' ? 2.5 : 2} />
              <span className="text-[10px] font-bold">សមត្ថភាព</span>
            </button>
          </div>
        </div>
      )}
      </div>

      {/* MODALS & OVERLAYS REMAIN THE SAME AS PREVIOUS VERSION */}
      <AnimatePresence>
        {showLevelModal && selectedTopic && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-6 backdrop-blur-sm"
            onClick={() => setShowLevelModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${TOPICS.find(t=>t.id===selectedTopic)?.color}`}>
                    {React.createElement(TOPICS.find(t=>t.id===selectedTopic)?.icon || Sigma, { size: 24 })}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-khmerHeading">{TOPICS.find(t=>t.id===selectedTopic)?.label}</h3>
                    <p className="text-xs text-gray-400">ជ្រើសរើសកម្រិត</p>
                  </div>
                </div>
                <button onClick={() => setShowLevelModal(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
              </div>
              
              <div className="space-y-3">
                {[
                  { id: 'normal', label: 'ធម្មតា', desc: 'រូបមន្តមូលដ្ឋាន', color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
                  { id: 'medium', label: 'មធ្យម', desc: 'កម្រិតប្រលងឆមាស', color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
                  { id: 'hard', label: 'ពិបាក', desc: 'កម្រិតប្រឡូងបាក់ឌុប', color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' }
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => handleStartGame(lvl.id as Difficulty)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${lvl.color}`}
                  >
                    <div className="font-bold text-lg">{lvl.label}</div>
                    <div className="text-xs opacity-80">{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTopicDetail && (
           <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
           className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-6 backdrop-blur-sm"
           onClick={() => setShowTopicDetail(null)}
         >
           <motion.div 
             initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
             className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl"
             onClick={e => e.stopPropagation()}
           >
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold font-khmerHeading">Details</h3>
               <button onClick={() => setShowTopicDetail(null)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
             </div>
             {(() => {
                 const data = stats.topicStats[showTopicDetail];
                 const info = TOPICS.find(t => t.id === showTopicDetail);
                 if(!data || !info) return null;
                 return (
                     <div className="space-y-4">
                         <div className="flex items-center gap-3 mb-4">
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center ${info.color}`}><info.icon/></div>
                             <div>
                                 <div className="font-bold text-lg">{info.label}</div>
                                 <div className="text-sm text-gray-500">{data.total} Questions Attempted</div>
                             </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="bg-green-50 p-4 rounded-xl text-center">
                                 <div className="text-2xl font-bold text-green-600">{data.correct}</div>
                                 <div className="text-xs text-green-800">Correct</div>
                             </div>
                             <div className="bg-red-50 p-4 rounded-xl text-center">
                                 <div className="text-2xl font-bold text-red-600">{data.total - data.correct}</div>
                                 <div className="text-xs text-red-800">Wrong</div>
                             </div>
                         </div>
                     </div>
                 )
             })()}
           </motion.div>
         </motion.div>
        )}
      </AnimatePresence>

      {/* PLAYING SCREEN OVERLAY */}
      <AnimatePresence>
        {gameState === 'playing' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50 flex flex-col font-khmer h-[100dvh]"
          >
             <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 shrink-0">
              <div className="max-w-2xl md:max-w-4xl mx-auto flex items-center justify-between w-full">
                <button onClick={() => setGameState('menu')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                  <ArrowLeft className="w-5 h-5 text-[#222222]" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-airbnb-gray uppercase tracking-wider mb-1">{questions[currentIndex]?.khmerLabel}</span>
                  <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-[#FF385C]" initial={{ width: 0 }} animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                  </div>
                </div>
                <div className="w-8" />
              </div>
            </header>

            {/* SCROLLABLE CONTENT AREA */}
            <main className="flex-1 px-6 py-8 max-w-2xl md:max-w-4xl mx-auto w-full flex flex-col overflow-y-auto">
              {isImageTopic && remainingImages <= 5 && remainingImages > 0 && (
                <div className="flex justify-center mb-4 shrink-0">
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-4 py-1.5 rounded-full border border-orange-200 flex items-center gap-2 shadow-sm">
                    <CheckCircle2 size={14} /> នៅសល់តែ {remainingImages} លំហាត់ទៀតប៉ុណ្ណោះ
                  </span>
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div key={questions[currentIndex]?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 my-auto w-full">
                  <div className="bg-white shadow-airbnb rounded-3xl p-6 md:p-8 min-h-[200px] flex flex-col items-center justify-center border border-gray-100 relative">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{questions[currentIndex]?.theme}</p>
                    {questions[currentIndex]?.isImageOnly ? (
                      <div className="w-full flex justify-center py-4">
                        <img src={questions[currentIndex]?.imageUrl} alt="Probability Question" className="max-w-full h-auto rounded-lg shadow-sm" />
                      </div>
                    ) : (
                      <>
                        <p className="text-lg text-[#6a6a6a] mb-4 text-center w-full">គណនាតម្លៃខាងក្រោម៖</p>
                        <MathDisplay latex={questions[currentIndex]?.latex || ""} />
                      </>
                    )}
                  </div>

                  {!questions[currentIndex]?.isImageOnly && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {questions[currentIndex]?.options.map((opt, idx) => {
                      let style = "border-gray-200 bg-white text-[#222222] hover:bg-gray-50";
                      if (isAnswered) {
                        if (idx === questions[currentIndex].correctIndex) style = "border-green-500 bg-green-50 text-green-800 ring-1 ring-green-500";
                        else if (idx === selectedOption) style = "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500";
                        else style = "border-gray-100 bg-gray-50 text-gray-400 opacity-50";
                      } else if (selectedOption === idx) {
                        style = "border-[#222222] bg-[#222222] text-white shadow-lg";
                      }

                      return (
                        <motion.button
                          key={idx}
                          whileTap={!isAnswered ? { scale: 0.98 } : {}}
                          onClick={() => setSelectedOption(idx)}
                          disabled={isAnswered}
                          className={`p-4 text-left rounded-xl border-2 transition-all flex items-center justify-between text-lg ${style}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && idx === questions[currentIndex].correctIndex && <CheckCircle2 className="w-6 h-6 text-green-600" />}
                          {isAnswered && idx === selectedOption && idx !== questions[currentIndex].correctIndex && <XCircle className="w-6 h-6 text-red-600" />}
                        </motion.button>
                      );
                      })}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </main>

            <div className="fixed md:absolute bottom-24 md:bottom-28 right-6 md:right-8 flex flex-col gap-3 z-30">
              <motion.button
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  onClick={() => setShowCalculator(true)}
                  className="w-12 h-12 md:w-14 md:h-14 bg-white border border-gray-200 text-indigo-600 rounded-full shadow-2xl md:shadow-lg flex items-center justify-center hover:bg-indigo-50 transition-colors"
              >
                  <Calculator size={20} className="md:w-6 md:h-6" />
              </motion.button>
              <motion.button
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  onClick={() => setShowScratchpad(true)}
                  className="w-12 h-12 md:w-14 md:h-14 bg-white border border-gray-200 text-[#222222] rounded-full shadow-2xl md:shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                  <PenTool size={20} className="md:w-6 md:h-6" />
              </motion.button>
            </div>

            <footer className="p-6 bg-white border-t border-gray-100 shrink-0">
              <div className="max-w-2xl md:max-w-4xl mx-auto">
                {questions[currentIndex]?.isImageOnly ? (
                  <button onClick={handleImageQuestionDone} className="w-full py-4 bg-[#FF385C] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:bg-rose-600 shadow-lg">
                    បានធ្វើរួចហើយ <CheckCircle2 className="w-5 h-5" />
                  </button>
                ) : !isAnswered ? (
                  <button onClick={handleSubmit} disabled={selectedOption === null} className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${selectedOption !== null ? 'bg-[#FF385C] text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                    ដាក់ចម្លើយ
                  </button>
                ) : (
                  <button onClick={handleNext} className="w-full py-4 bg-[#222222] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2">
                    សំណួរបន្ទាប់ <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </footer>

            <AnimatePresence>
            {showScratchpad && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-blur-sm"
                    onClick={() => setShowScratchpad(false)}
                >
                    <motion.div 
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        className="bg-white w-full max-w-lg h-[80vh] sm:h-[600px] sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <DrawingCanvas currentTheme={questions[currentIndex]?.theme} />
                        <div className="p-4 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setShowScratchpad(false)} className="px-6 py-2 bg-[#222222] text-white rounded-xl font-bold">
                                រួចរាល់
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {showCalculator && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-blur-sm"
                    onClick={() => setShowCalculator(false)}
                >
                    <motion.div 
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        className="bg-white w-full max-w-lg h-[80vh] sm:h-[600px] sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <CalculatorWidget onClose={() => setShowCalculator(false)} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">...</span>
              </div>
              <h3 className="text-xl font-bold font-khmerHeading mb-3 text-[#222222]">អបអរសាទរ!</h3>
              <p className="text-[#6a6a6a] mb-8 font-khmer leading-relaxed">
                អ្នកបានធ្វើលំហាត់ទាំងអស់ wow ពូកែមែន cute ម៉េស &lt;3
              </p>
              <button 
                onClick={() => {
                  setShowCompletionModal(false);
                  handleStartGame(selectedDifficulty, questions[0].topic);
                }} 
                className="w-full py-4 bg-[#FF385C] text-white rounded-xl font-bold text-lg hover:bg-rose-600 transition-colors shadow-lg"
              >
                ធ្វើបន្តទៀត
              </button>
              <button 
                onClick={() => {
                  setShowCompletionModal(false);
                  setGameState('menu');
                }} 
                className="w-full py-4 mt-3 bg-gray-100 text-[#222222] rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors"
              >
                ត្រឡប់ទៅម៉ឺនុយ
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REVIEW SCREEN OVERLAY */}
       <AnimatePresence>
        {gameState === 'review' && (
             <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 bg-[#F7F7F7] z-50 flex flex-col font-khmer h-[100dvh]"
           >
              <header className="bg-white sticky top-0 z-10 border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="max-w-2xl md:max-w-5xl mx-auto w-full flex justify-between items-center">
                  <h2 className="text-xl md:text-2xl font-bold">លទ្ធផល</h2>
                  {!questions[0]?.isImageOnly && (
                    <div className="bg-rose-50 text-[#FF385C] px-4 py-1.5 rounded-full text-sm md:text-base font-bold">{score}/{questions.length}</div>
                  )}
                </div>
              </header>
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl md:max-w-5xl mx-auto p-6 space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6 pb-24 md:pb-10">
                    {userAnswers.map((ans, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-2xl p-6 shadow-airbnb border-l-4 ${ans.ok ? 'border-green-500' : 'border-red-500'}`}>
                        <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold text-airbnb-gray uppercase">{ans.q.khmerLabel}</span>
                        {!ans.q.isImageOnly && (ans.ok ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />)}
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 mb-4 overflow-hidden flex justify-center">
                          {ans.q.isImageOnly ? (
                            <img src={ans.q.imageUrl} alt="Probability Question" className="max-w-full h-auto rounded-lg shadow-sm" />
                          ) : (
                            <MathDisplay latex={ans.q.latex} />
                          )}
                        </div>
                        {!ans.q.isImageOnly && (
                          <div className="space-y-2 text-sm">
                            <p className={`${ans.ok ? 'text-green-700' : 'text-red-700'}`}><span className="font-semibold">ចម្លើយរបស់អ្នក:</span> {ans.q.options[ans.sel]}</p>
                            {!ans.ok && <p className="text-green-700"><span className="font-semibold">ចម្លើយត្រូវ:</span> {ans.q.options[ans.q.correctIndex]}</p>}
                          </div>
                        )}
                    </motion.div>
                    ))}
                </div>
              </div>
              <div className="p-6 bg-white/90 backdrop-blur-md border-t border-gray-200 shrink-0">
                <div className="max-w-2xl md:max-w-5xl mx-auto flex justify-center">
                  <button onClick={() => setGameState('menu')} className="w-full md:w-[350px] py-4 bg-[#222222] text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:bg-black">
                    <RefreshCw className="w-5 h-5" /> ត្រឡប់ទៅម៉ឺនុយ
                  </button>
                </div>
              </div>
           </motion.div>
        )}
       </AnimatePresence>

    </div>
  );
}
