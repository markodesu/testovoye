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

  const color = useMemo(() => oklch({ l, c, h, alpha: a }), [l, c, h, a]);
  const srgb = useMemo(() => rgb(color), [color]);
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

    const nextL = clamp(parsedOklch.l, 0, 100);
    const nextC = Math.max(parsedOklch.c, 0);
    const nextH = normalizeHue(parsedOklch.h);
    const nextA = clamp(parsedOklch.alpha ?? 1, 0, 1);

    setL(Number(nextL.toFixed(2)));
    setC(Number(nextC.toFixed(2)));
    setH(Number(nextH.toFixed(2)));
    setA(Number(nextA.toFixed(2)));
    setInputError('');
  };

  const previewStyle = {
    width: 180,
    height: 180,
    borderRadius: 12,
    border: '1px solid #ccc',
    backgroundColor: srgb
      ? `rgba(${Math.round(srgb.r * 255)}, ${Math.round(srgb.g * 255)}, ${Math.round(srgb.b * 255)}, ${a})`
      : '#000',
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#111' }}>
      <h2>OKLCH Color Picker</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <Slider label="Lightness (L)" value={l} min={0} max={100} step={0.1} onChange={setL} />
          <Slider label="Chroma (C)" value={c} min={0} max={120} step={0.1} onChange={setC} />
          <Slider label="Hue (H)" value={h} min={0} max={360} step={0.1} onChange={setH} />
          <Slider label="Alpha (A)" value={a} min={0} max={1} step={0.01} onChange={setA} />
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div style={previewStyle} />
          <div style={{ padding: 14, borderRadius: 12, background: '#f8f8f8', border: '1px solid #ddd', display: 'grid', gap: 10 }}>
            <div style={{ marginBottom: 4, fontWeight: 600 }}>Current color</div>
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
              <div style={{ color: '#a00', fontSize: 13, lineHeight: 1.4 }}>{inputError}</div>
            )}
          </div>
          {!gamutOk && (
            <div style={{ padding: 12, borderRadius: 10, background: '#fff4e5', color: '#a35b00', border: '1px solid #f0c27b' }}>
              Warning: the color is out of sRGB gamut and may display incorrectly.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange }) {
  return (
    <label style={{ display: 'grid', gap: 8, fontSize: 14 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#444' }}>
        <span>{min}</span>
        <strong>{value}</strong>
        <span>{max}</span>
      </div>
    </label>
  );
}

function TextInput({ label, value, onChange, onCommit }) {
  return (
    <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onCommit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onCommit();
          }
        }}
        style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #ccc', fontFamily: 'monospace' }}
      />
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
  const srgbColor = rgb(oklch({ l, c, h, alpha: a }));
  if (!srgbColor) {
    return 'rgb(0, 0, 0)';
  }

  const r = Math.round(srgbColor.r * 255);
  const g = Math.round(srgbColor.g * 255);
  const b = Math.round(srgbColor.b * 255);

  return a < 1
    ? `rgb(${r}, ${g}, ${b}) / ${Number(a.toFixed(2))}`
    : `rgb(${r}, ${g}, ${b})`;
}
