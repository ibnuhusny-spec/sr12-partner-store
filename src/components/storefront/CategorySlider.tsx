import React from 'react';

interface CategorySliderProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const CategorySlider: React.FC<CategorySliderProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari produk herbal SR12 (deodorant, salimah slim, gomilku, manjakani)..."
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '9999px',
            border: '1.5px solid #cbd5e1',
            fontSize: '0.86rem',
            background: '#ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              background: '#f1f5f9',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#475569'
            }}
          >
            Reset
          </button>
        )}
      </div>

      <div className="category-slider">
        {categories.map(cat => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              className={`category-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              {cat === 'all' ? '🌿 Semua Produk' : cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};
