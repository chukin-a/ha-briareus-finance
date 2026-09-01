import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QrScanner } from './QrScanner';

const decodeText = vi.hoisted(() => vi.fn());
vi.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: class {
    decodeFromConstraints(_constraints: unknown, _video: unknown, callback: (result: { getText: () => string } | null, error?: { name: string }) => void) {
      callback({ getText: () => decodeText() }, undefined);
      return Promise.resolve({ stop: vi.fn() });
    }
  },
}));

describe('QrScanner', () => {
  it('extracts receipt id, amount, date and fiscal number from a QR URL', async () => {
    decodeText.mockReturnValue('https://tax.example/check?id=abc123&sm=69%20727%2C45&date=20260831&fn=4000951703');
    const onScan = vi.fn();
    render(<QrScanner onScan={onScan} onError={vi.fn()} />);
    await waitFor(() => expect(onScan).toHaveBeenCalledWith({ id: 'abc123', url: 'https://tax.example/check?id=abc123&sm=69 727,45&date=20260831&fn=4000951703', amountMinor: 6972745, date: '2026-08-31', fn: '4000951703' }));
  });

  it('reports a QR URL without a receipt id', async () => {
    decodeText.mockReturnValue('https://tax.example/check?sm=10.00');
    const onError = vi.fn();
    render(<QrScanner onScan={vi.fn()} onError={onError} />);
    await waitFor(() => expect(onError).toHaveBeenCalledWith('У QR-коді немає номера фіскального чека'));
  });
});
