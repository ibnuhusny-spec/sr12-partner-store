import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { getProductTierPrice, SR12_TIERS } from '../../config/tiers';
import { X, ShoppingBag, ShieldCheck, Check, Sparkles } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { activeTier, addToCart } = useApp();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const tierPrice = getProductTierPrice(product.het, activeTier);
  const tierInfo = SR12_TIERS[activeTier];

  const handleAdd = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 600);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        {/* Header */}
        <div className="modal-header-gradient">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#fde68a" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Detail Produk SR12</h3>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Image */}
            <div style={{ width: '180px', height: '180px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
              <img
                src={product.image}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '220px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                {product.category}
              </span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 10px' }}>
                {product.name}
              </h2>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: '6px', border: '1px solid #a7f3d0', fontWeight: 700 }}>
                  <ShieldCheck size={11} style={{ display: 'inline', marginRight: '3px' }} />
                  BPOM: {product.bpom}
                </span>
                <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', border: '1px solid #fde68a', fontWeight: 700 }}>
                  Halal MUI
                </span>
                <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  Netto: {product.netto}
                </span>
              </div>

              {/* Price */}
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#065f46' }}>
                  Rp {tierPrice.toLocaleString('id-ID')}
                </div>
                {tierPrice < product.het && (
                  <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>
                    Level {tierInfo.name} &bull; Hemat Rp {(product.het - tierPrice).toLocaleString('id-ID')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
              Deskripsi Produk:
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.6 }}>
              {product.summary}
            </p>
          </div>

          {/* Realtime Stock Status Olsera */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            background: product.stock === 0
              ? 'rgba(239, 68, 68, 0.1)'
              : product.stock <= 15
              ? 'rgba(245, 158, 11, 0.1)'
              : 'rgba(16, 185, 129, 0.1)',
            color: product.stock === 0
              ? '#b91c1c'
              : product.stock <= 15
              ? '#b45309'
              : '#047857',
            border: `1px solid ${
              product.stock === 0
                ? 'rgba(239, 68, 68, 0.25)'
                : product.stock <= 15
                ? 'rgba(245, 158, 11, 0.25)'
                : 'rgba(16, 185, 129, 0.25)'
            }`
          }}>
            <span style={{ fontWeight: 800 }}>Status Inventori Gudang:</span>
            <span style={{ fontWeight: 800 }}>
              {product.stock === 0 ? '🔴 Stok Habis' : product.stock <= 15 ? `🟡 Sisa ${product.stock} pcs (Menipis)` : `🟢 Ready ${product.stock} pcs`}
            </span>
          </div>

          {/* Stepper & Add to cart button */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '2px', opacity: product.stock === 0 ? 0.4 : 1 }}>
              <button
                type="button"
                disabled={product.stock === 0}
                onClick={() => setQty(Math.max(1, qty - 1))}
                style={{ width: '32px', height: '32px', fontWeight: 800, fontSize: '1.1rem' }}
              >
                -
              </button>
              <span style={{ width: '36px', textAlign: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                {qty}
              </span>
              <button
                type="button"
                disabled={product.stock === 0}
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                style={{ width: '32px', height: '32px', fontWeight: 800, fontSize: '1.1rem' }}
              >
                +
              </button>
            </div>

            <button
              type="button"
              disabled={product.stock === 0}
              onClick={handleAdd}
              style={{
                flex: 1,
                background: product.stock === 0 ? '#94a3b8' : added ? '#059669' : 'linear-gradient(135deg, #059669, #047857)',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: product.stock === 0 ? 'none' : '0 4px 12px rgba(5,150,105,0.35)',
                cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {added ? <Check size={18} /> : <ShoppingBag size={18} />}
              <span>
                {product.stock === 0
                  ? 'Stok Habis (Menunggu Pasokan)'
                  : added
                  ? 'Berhasil Ditambahkan!'
                  : `Tambah ke Keranjang (Rp ${(tierPrice * qty).toLocaleString('id-ID')})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
