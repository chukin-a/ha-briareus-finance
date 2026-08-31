import { useEffect, useRef } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';

export type TaxQrData = { id: string; url: string; date?: string; fn?: string };

function parseTaxUrl(value: string): TaxQrData | null {
  try {
    const url = new URL(value);
    const id = url.searchParams.get('id') || url.searchParams.get('checkId');
    if (!id) return null;
    return { id, url: value, date: url.searchParams.get('date') || undefined, fn: url.searchParams.get('fn') || undefined };
  } catch {
    return null;
  }
}

export function QrScanner({ onScan, onError }: { onScan: (data: TaxQrData) => void; onError: (message: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const reader = new BrowserQRCodeReader();
    let controls: IScannerControls | undefined;
    let stopped = false;
    void reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } }, audio: false }, video.current!, (result, error) => {
      if (stopped || !result) {
        if (error && error.name !== 'NotFoundException') onError('Не вдалося прочитати QR-код');
        return;
      }
      const parsed = parseTaxUrl(result.getText());
      if (!parsed) { onError('У QR-коді немає номера фіскального чека'); return; }
      stopped = true;
      onScan(parsed);
      controls?.stop();
    }).then(value => { controls = value; if (stopped) controls.stop(); }).catch(() => onError('Немає доступу до камери'));
    return () => { stopped = true; controls?.stop(); };
  }, [onError, onScan]);
  return <div className="qr-scanner"><video ref={video} muted playsInline /><p>Наведіть камеру на QR-код фіскального чека</p></div>;
}
