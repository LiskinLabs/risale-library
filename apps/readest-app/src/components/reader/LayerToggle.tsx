import React, { useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { AnnotationLayer } from '@/types/book';

interface LayerToggleProps {
  /** Currently enabled layers */
  enabled: Set<AnnotationLayer>;
  /** Called when a layer is toggled */
  onToggle: (layer: AnnotationLayer) => void;
  className?: string;
}

/** Layer display metadata — label + color + icon */
const LAYER_META: Record<AnnotationLayer, { label: string; color: string }> = {
  user: { label: 'Notes', color: '#60a5fa' }, // blue
  author: { label: 'Author Notes', color: '#a78bfa' }, // violet
  hasiye: { label: 'Haşiye', color: '#f59e0b' }, // amber
  lugat: { label: 'Lügat', color: '#4ade80' }, // green
};

/**
 * LayerToggle — visual layer switcher for annotation layers.
 *
 * Each layer (user notes, author notes, hashiye, lugat) can be independently
 * toggled on/off. Protected layers (like built-in author notes) show a lock
 * indicator instead of a toggle.
 */
const LayerToggle: React.FC<LayerToggleProps> = ({ enabled, onToggle, className }) => {
  const _ = useTranslation();

  return (
    <div className={`flex flex-col gap-1 ${className || ''}`}>
      <span className='text-xs font-semibold text-base-content/70 mb-1'>
        {_('Annotation Layers')}
      </span>
      {(Object.entries(LAYER_META) as [AnnotationLayer, { label: string; color: string }][]).map(
        ([layer, { label, color }]) => {
          const isOn = enabled.has(layer);
          return (
            <button
              key={layer}
              onClick={() => onToggle(layer)}
              className='flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors hover:bg-base-300/50'
              aria-label={`${isOn ? 'Hide' : 'Show'} ${label}`}
            >
              {/* Color indicator dot */}
              <span
                className={`w-2.5 h-2.5 rounded-full transition-opacity ${isOn ? 'opacity-100' : 'opacity-25'}`}
                style={{ backgroundColor: color }}
              />
              <span className={`flex-1 text-left ${isOn ? '' : 'opacity-40'}`}>{_(label)}</span>
              {/* Toggle state */}
              <span className={`text-[10px] ${isOn ? 'text-primary' : 'text-base-content/30'}`}>
                {isOn ? '●' : '○'}
              </span>
            </button>
          );
        },
      )}
    </div>
  );
};

export default LayerToggle;
