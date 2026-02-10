import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const btnStyle = {
    display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px',
    borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-page)',
    cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-main)',
    transition: 'all 0.2s'
  };

  const disabledStyle = { ...btnStyle, opacity: 0.5, cursor: 'not-allowed', background: 'var(--bg-sidebar)' };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', gap: '16px', borderTop: '1px solid var(--border-color)' }}>
      <button 
        onClick={() => onPageChange(Math.max(1, currentPage - 1))} 
        disabled={currentPage === 1}
        style={currentPage === 1 ? disabledStyle : btnStyle}
      >
        <ChevronLeft size={16} /> Prev
      </button>
      
      <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 500 }}>
        Page {currentPage} of {totalPages || 1}
      </span>

      <button 
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} 
        disabled={currentPage === totalPages || totalPages === 0}
        style={(currentPage === totalPages || totalPages === 0) ? disabledStyle : btnStyle}
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
};