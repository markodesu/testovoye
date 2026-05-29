import React, { useEffect, useMemo, useState } from 'react';
import { oklch, parse, rgb } from 'culori';

const DEFAULT_COLOR = { l: 70, c: 35, h: 200, a: 1 };
const HASH_KEYS = ['l', 'c', 'h', 'a'];

export default function OklchColorPicker() {
  const initialColor = useMemo(() => getColorFromHash() || DEFAULT_COLOR, []);

  const [l, setL] = useState(initialColor.l);
  const [c, setC] = useState(initialColor.c);
  const [h, setH] = useState(initialColor.h);
  const [a, setA] = useState(initialColor.a);
  const [oklchInput, setOklchInput] = useState(() => formatOklchString(initialColor));
  const [rgbInput, setRgbInput] = useState(() => formatRgbString(initialColor));
  const [inputError, setInputError] = useState('');

  // Library expects L and C in 0..1, state stores L in 0..100 and C in 0..120
  const color = useMemo(() => oklch({ l: l / 100, c: c / 100, h, alpha: a }), [l, c, h, a]);
  const srgb = useMemo(() => rgb(color), [color]);

  // Build a CSS color string from the `rgbInput` display string so preview uses the exact text input
  const previewColorCss = useMemo(() => {
    if (!rgbInput) return '#000';
    const parts = rgbInput.split('/');
    if (parts.length === 2) {
      const rgbPart = parts[0].trim();
      const alphaPart = parts[1].trim();
      const alphaNum = Number(alphaPart);
      const nums = rgbPart.match(/\d+/g);
      if (nums && nums.length >= 3 && !Number.isNaN(alphaNum)) {
        return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alphaNum})`;
      }
    }
    return rgbInput;
  }, [rgbInput]);
  const gamutOk = useMemo(
    () =>
      !!srgb && [srgb.r, srgb.g, srgb.b].every((channel) => channel >= 0 && channel <= 1),
    [srgb]
  );

  useEffect(() => {
    setOklchInput(formatOklchString({ l, c, h, a }));
    setRgbInput(formatRgbString({ l, c, h, a }));
    setInputError('');
    updateHash({ l, c, h, a });
  }, [l, c, h, a]);

  const handleColorInputCommit = (value) => {
    const parsed = parse(value.trim());
    if (!parsed) {
      setInputError('Could not parse the color. Use rgb(...) or oklch(...)');
      return;
    }

    const parsedOklch = oklch(parsed);
    if (!parsedOklch || Number.isNaN(parsedOklch.l) || Number.isNaN(parsedOklch.c) || Number.isNaN(parsedOklch.h)) {
      setInputError('Could not convert the color to OKLCH. Try another format.');
      return;
    }
      // parsedOklch values are in library scale (L and C in 0..1), convert to state scale
      const nextL = clamp(parsedOklch.l * 100, 0, 100);
      const nextC = clamp(parsedOklch.c * 100, 0, 120);
    const nextH = normalizeHue(parsedOklch.h);
    const nextA = clamp(parsedOklch.alpha ?? 1, 0, 1);

    setL(Number(nextL.toFixed(2)));
    setC(Number(nextC.toFixed(2)));
    setH(Number(nextH.toFixed(2)));
    setA(Number(nextA.toFixed(2)));
    setInputError('');
  };

  const previewStyle = {
    width: 200,
    height: 200,
    borderRadius: 16,
    border: '2px solid rgba(0,0,0,0.1)',
    backgroundColor: previewColorCss || (srgb
      ? `rgba(${Math.round(srgb.r * 255)}, ${Math.round(srgb.g * 255)}, ${Math.round(srgb.b * 255)}, ${a})`
      : '#000'),
    boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 8px 40px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#111',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        maxWidth: 600,
        width: '100%',
        padding: '40px',
        borderRadius: 24,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.2)',
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: 32, 
          fontSize: 28, 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          OKLCH Color Picker
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 24 }}>
            <Slider label="Lightness (L)" value={l} min={0} max={100} step={0.1} onChange={setL} />
            <Slider label="Chroma (C)" value={c} min={0} max={120} step={0.1} onChange={setC} />
            <Slider label="Hue (H)" value={h} min={0} max={360} step={0.1} onChange={setH} />
            <Slider label="Alpha (A)" value={a} min={0} max={1} step={0.01} onChange={setA} />
          </div>

          <div style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
            <div style={previewStyle} />
            <div style={{ 
              padding: 20, 
              borderRadius: 16, 
              background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)', 
              border: '1px solid rgba(0,0,0,0.1)', 
              display: 'grid', 
              gap: 14,
              width: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <div style={{ marginBottom: 4, fontWeight: 700, fontSize: 15, color: '#333' }}>Current color</div>
              <TextInput
                label="OKLCH"
                value={oklchInput}
                onChange={setOklchInput}
                onCommit={() => handleColorInputCommit(oklchInput)}
              />
              <TextInput
                label="RGB"
                value={rgbInput}
                onChange={setRgbInput}
                onCommit={() => handleColorInputCommit(rgbInput)}
              />
              {inputError && (
                <div style={{ color: '#dc2626', fontSize: 13, lineHeight: 1.5, fontWeight: 500 }}>{inputError}</div>
              )}
            </div>
            {!gamutOk && (
              <div style={{ 
                padding: 14, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', 
                color: '#c2410c', 
                border: '1px solid #fed7aa',
                fontWeight: 500,
                fontSize: 13,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                Warning: the color is out of sRGB gamut and may display incorrectly.
              </div>
            )}
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            div[style*="gridTemplateColumns: '1fr 280px'"] {
              grid-template-columns: 1fr !important;
            }
            div[style*="justifyItems: 'center'"] {
              justifyItems: center !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange }) {
  return (
    <label style={{ display: 'grid', gap: 10, fontSize: 14 }}>
      <span style={{ fontWeight: 600, color: '#374151' }}>{label}</span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ 
          width: '100%',
          height: 8,
          borderRadius: 4,
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          outline: 'none',
          WebkitAppearance: 'none',
          cursor: 'pointer'
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
        <span>{min}</span>
        <strong style={{ color: '#667eea' }}>{value}</strong>
        <span>{max}</span>
      </div>
    </label>
  );
}

function TextInput({ label, value, onChange, onCommit }) {
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState(false);

  const handleCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // ignore clipboard errors silently
      console.error('Copy failed', e);
    }
  };

  return (
    <label style={{ display: 'grid', gap: 8, fontSize: 13 }}>
      <span style={{ fontWeight: 600, color: '#374151' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb';
            e.target.style.boxShadow = 'none';
            onCommit();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onCommit();
            }
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#667eea';
            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
          }}
          style={{ 
            width: '100%', 
            boxSizing: 'border-box', 
            padding: '12px 14px', 
            borderRadius: 10, 
            border: '2px solid #e5e7eb',
            fontFamily: 'monospace',
            fontSize: 13,
            background: 'white',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            outline: 'none'
          }}
        />
        <button
          type="button"
          onClick={handleCopy}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            border: 'none',
            background: hover ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: hover ? '0 4px 12px rgba(102, 126, 234, 0.4)' : '0 2px 8px rgba(102, 126, 234, 0.3)',
          }}
          aria-label={`Copy ${label} value`}
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>
    </label>
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeHue(value) {
  const wrapped = Number(value) % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

function updateHash({ l, c, h, a }) {
  if (typeof window === 'undefined') {
    return;
  }

  window.history.replaceState(null, '', `#${Number(l.toFixed(2))},${Number(c.toFixed(2))},${Number(h.toFixed(2))},${Number(a.toFixed(2))}`);
}

function getColorFromHash() {
  if (typeof window === 'undefined') {
    return null;
  }

  const hash = window.location.hash.slice(1);
  if (!hash) {
    return null;
  }

  const parts = hash.split(',').map((part) => parseFloat(part.trim()));
  if (parts.length !== HASH_KEYS.length || parts.some((value) => Number.isNaN(value))) {
    return null;
  }

  return {
    l: clamp(parts[0], 0, 100),
    c: Math.max(parts[1], 0),
    h: normalizeHue(parts[2]),
    a: clamp(parts[3], 0, 1),
  };
}

function formatOklchString({ l, c, h, a }) {
  return `oklch(${Number(l.toFixed(2))} ${Number(c.toFixed(2))} ${Number(h.toFixed(2))} / ${Number(a.toFixed(2))})`;
}

function formatRgbString({ l, c, h, a }) {
  // Normalize L and C for the library (state stores L and C in 0..100)
  const srgbColor = rgb(oklch({ l: l / 100, c: c / 100, h, alpha: a }));
  if (!srgbColor) {
    return 'rgb(0, 0, 0)';
  }

  // Clamp channels to 0..255 to avoid displaying out-of-range values
  const r = Math.round(clamp(srgbColor.r * 255, 0, 255));
  const g = Math.round(clamp(srgbColor.g * 255, 0, 255));
  const b = Math.round(clamp(srgbColor.b * 255, 0, 255));

  return a < 1
    ? `rgb(${r}, ${g}, ${b}) / ${Number(a.toFixed(2))}`
    : `rgb(${r}, ${g}, ${b})`;
}
