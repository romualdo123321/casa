import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface PhotoLightboxModalProps {
  imageUrl: string;
  onClose: () => void;
}

export default function PhotoLightboxModal({ imageUrl, onClose }: PhotoLightboxModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Controls */}
        <div className="w-full flex items-center justify-between pb-3 text-white">
          <span className="text-xs font-bold text-blue-400">Visualização de Foto</span>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download="msn_foto"
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md transition shadow"
              title="Baixar Foto"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md transition shadow"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Full Image */}
        <div className="rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-black/60 max-h-[80vh] backdrop-blur-md">
          <img
            src={imageUrl}
            alt="Foto em tela cheia"
            className="w-full h-full object-contain max-h-[80vh]"
          />
        </div>
      </div>
    </div>
  );
}
