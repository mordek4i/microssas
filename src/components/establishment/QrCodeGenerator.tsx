import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../../context/AppContext';
import { Download, Printer, QrCode as QrIcon, Sparkles, Copy, Check } from 'lucide-react';

export const QrCodeGenerator: React.FC = () => {
  const { currentEstablishment } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  const publicUrl = `${window.location.origin}/r/${currentEstablishment.slug}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        publicUrl,
        {
          width: 220,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [publicUrl, currentEstablishment]);

  const handleDownloadQr = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrcode-reservazen-${currentEstablishment.slug}.png`;
      link.href = url;
      link.click();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintStand = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <QrIcon className="w-4 h-4 text-teal-600" />
            <span>Seu QR Code de Reservas Exclusivo</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Divulgue seu QR Code nas mesas, balcão, porta de entrada ou redes sociais.
          </p>
        </div>

        {/* Public Link Box */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-600 font-semibold shrink-0">Link Direto:</span>
          <code className="bg-white text-teal-700 px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs flex-1 truncate w-full">
            {publicUrl}
          </code>
          <button
            onClick={handleCopyLink}
            className="bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
          </button>
        </div>

        {/* Display Canvas & Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* QR Code Canvas */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
              <canvas ref={canvasRef} />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 mt-3">{currentEstablishment.name}</h4>
            <p className="text-xs text-slate-500 font-medium">Escaneie para fazer sua reserva</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Onde utilizar seu QR Code?</span>
              </h4>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Display de acrílico nas mesas ou balcão</li>
                <li>Porta de entrada do estabelecimento</li>
                <li>Instagram Bio & Stories</li>
                <li>Cartões de visita e panfletos</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadQr}
                className="flex-1 bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Baixar PNG</span>
              </button>

              <button
                onClick={handlePrintStand}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Display</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
