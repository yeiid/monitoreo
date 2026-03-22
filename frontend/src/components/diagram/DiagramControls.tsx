import React from 'react';
import { Plus, Trash2, Save } from 'lucide-react';

interface DiagramControlsProps {
  splitterType: string;
  setSplitterType: (type: string) => void;
  onAddSplitter: () => void;
  onClearEdges: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

const DiagramControls: React.FC<DiagramControlsProps> = ({
  splitterType,
  setSplitterType,
  onAddSplitter,
  onClearEdges,
  onSave,
  isSaving
}) => {
  return (
    <div className="splice-toolbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <select 
          className="form-input" 
          style={{ 
            width: '85px', 
            padding: '6px 10px', 
            background: '#0a0a14', 
            fontSize: '0.75rem', 
            fontWeight: 800,
            border: '1px solid rgba(167, 139, 250, 0.3)'
          }} 
          value={splitterType} 
          onChange={(e) => setSplitterType(e.target.value)}
        >
          <option value="1x4">1x4</option>
          <option value="1x8">1x8</option>
          <option value="1x16">1x16</option>
        </select>
        
        <button 
          className="secondary-btn" 
          onClick={onAddSplitter} 
          style={{ fontSize: '0.7rem', padding: '8px 14px' }}
        >
          <Plus size={14} style={{ marginRight: '4px' }} /> 
          <span className="desktop-only text-nowrap">Agregar Splitter</span>
          <span className="mobile-only">Splitter</span>
        </button>

        <button 
          className="secondary-btn desktop-only" 
          onClick={onClearEdges} 
          style={{ fontSize: '0.7rem', padding: '8px 14px', opacity: 0.7 }}
        >
          <Trash2 size={14} style={{ marginRight: '4px' }} /> 
          Limpiar
        </button>
      </div>

      <div style={{ flex: 1 }} />

      <button 
        className="primary-btn" 
        onClick={onSave} 
        disabled={isSaving}
        style={{ 
          padding: '8px 24px', 
          fontSize: '0.75rem', 
          width: 'auto',
          minWidth: '100px'
        }}
      >
        {isSaving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
};

export default DiagramControls;
