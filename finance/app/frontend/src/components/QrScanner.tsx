import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';

export type TaxQrData = { id: string; url: string; date?: string; fn?: string; amountMinor?: number };

function parseTaxUrl(value: string): TaxQrData | null {
  try {
    const decoded = decodeURIComponent(value.trim());
    const url = new URL(decoded);
    const id = url.searchParams.get('id') || url.searchParams.get('checkId') || url.searchParams.get('check') || url.searchParams.get('fiscalId');
    if (!id) return null;
    const rawDate = url.searchParams.get('date') || '';
    const date = /^\d{8}$/.test(rawDate) ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}` : rawDate.slice(0, 10) || undefined;
    const rawAmount = (url.searchParams.get('sm') || '').replace(/\s/g, '').replace(',', '.');
    const amountMinor = /^\d+(\.\d{1,2})?$/.test(rawAmount) ? Math.round(Number(rawAmount) * 100) : undefined;
    return { id, url: decoded, date, fn: url.searchParams.get('fn') || undefined, amountMinor };
  } catch {
    return null;
  }
}

export function QrScanner({ onScan, onError }: { onScan: (data: TaxQrData) => void; onError: (message: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const lastText = useRef('');
  const [status, setStatus] = useState('Наведіть камеру на QR-код фіскального чека');
  useEffect(() => {
    const reader = new BrowserQRCodeReader();
    let controls: IScannerControls | undefined;
    let stopped = false;
    void reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 }, resizeMode: { ideal: 'none' } } as MediaTrackConstraints, audio: false }, video.current!, (result, error) => {
      if (stopped || !result) {
        if (error && error.name !== 'NotFoundException') onError('Не вдалося прочитати QR-код');
        return;
      }
      const text = result.getText();
      if (text === lastText.current) return;
      lastText.current = text;
      const parsed = parseTaxUrl(text);
      if (!parsed) { setStatus('У QR-коді немає номера фіскального чека'); onError('У QR-коді немає номера фіскального чека'); return; }
      stopped = true;
      setStatus('QR-код знайдено. Отримую чек з ДПС…');
      onScan(parsed);
      controls?.stop();
    }).then(value => {
      controls = value;
      const track = (video.current?.srcObject as MediaStream | null)?.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities() as MediaTrackCapabilities & { focusMode?: string[]; zoom?: { min: number; max: number } };
        const advanced: Record<string, unknown>[] = [];
        if (capabilities.focusMode?.includes('continuous')) advanced.push({ focusMode: 'continuous' });
        if (capabilities.zoom) advanced.push({ zoom: Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, 2)) });
        if (advanced.length) void track.applyConstraints({ advanced } as MediaTrackConstraints).catch(() => undefined);
      }
      if (stopped) controls.stop();
    }).catch(() => onError('Немає доступу до камери'));
    return () => { stopped = true; controls?.stop(); };
  }, [onError, onScan]);
  return <div className="qr-scanner"><video ref={video} muted playsInline /><div className="qr-scan-frame" aria-hidden="true"><i /><i /><i /><i /></div><p>{status}</p><small>Пошук виконується по всьому кадру</small></div>;
}
