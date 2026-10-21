import React from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { getProductTierPrice, SR12_TIERS } from '../../config/tiers';
import { ShoppingBag, Eye, Share2, Star, ShieldCheck } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpenDetail: (p: Product) => void;
  onOpenShare: (p: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetail,
  onOpenShare
}) => {
  const { activeTier, addToCart } = useApp();

  const tierPrice = getProductTierPrice(product.het, activeTier);
  const tierInfo = SR12_TIERS[activeTier];
  const hasDiscount = tierPrice < product.het;

  return (
    <article className="product-card" id={`product-card-${product.id}`}>
      {/* Product Image & Badges */}
      <div className="product-img-wrapper" onClick={() => onOpenDetail(product)} style={{ cursor: 'pointer' }}>
        <img
          src={product.image}
          alt={product.name}
          className="product-card-img"
          loading="lazy"
        />
        {product.isBestseller && (
          <span className="badge-bestseller">⭐ Terlaris</span>
        )}
        <span className="badge-stock">
          Stok: {product.stock > 0 ? product.stock : 'Habis'}
        </span>
      </div>

      {/* Info Body */}
      <div className="product-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="product-category-text">{product.category}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: '#f59e0b', fontWeight: 800 }}>
            <Star size={12} fill="#f59e0b" />
            <span>{product.rating || '4.9'}</span>
          </div>
        </div>

        <h3
          className="product-name"
          onClick={() => onOpenDetail(product)}
          style={{ cursor: 'pointer' }}
          title={product.name}
        >
          {product.name}
        </h3>

        {/* BPOM Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#059669', marginBottom: '8px' }}>
          <ShieldCheck size={12} />
          <span>BPOM {product.bpom}</span>
        </div>

        {/* Price Area */}
        <div className="product-price-box">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="price-het">
              Rp {tierPrice.toLocaleString('id-ID')}
            </span>
            {hasDiscount && (
              <span style={{ fontSize: '0.78rem', textDecoration: 'line-through', color: '#94a3b8' }}>
                Rp {product.het.toLocaleString('id-ID')}
              </span>
            )}
          </div>
          {hasDiscount && (
            <span className="price-modal-tier">
              Harga {tierInfo.name} (-{tierInfo.discountPct}%)
            </span>
          )}
        </div>

        {/* Realtime Stock Indicator Connected to Olsera Inventory */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '0.72rem',
          fontWeight: 700,
          marginBottom: '10px',
          background: product.stock === 0
            ? 'rgba(239, 68, 68, 0.1)'
            : product.stock <= 15
            ? 'rgba(245, 158, 11, 0.1)'
            : 'rgba(16, 185, 129, 0.1)',
          color: product.stock === 0
            ? '#ef4444'
            : product.stock <= 15
            ? '#d97706'
            : '#059669',
          border: `1px solid ${
            product.stock === 0
              ? 'rgba(239, 68, 68, 0.25)'
              : product.stock <= 15
              ? 'rgba(245, 158, 11, 0.25)'
              : 'rgba(16, 185, 129, 0.25)'
          }`
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: product.stock === 0 ? '#ef4444' : product.stock <= 15 ? '#f59e0b' : '#10b981',
            boxShadow: product.stock === 0 ? '0 0 6px #ef4444' : product.stock <= 15 ? '0 0 6px #f59e0b' : '0 0 6px #10b981'
          }} />
          <span>
            {product.stock === 0 ? (
              <b>Stok Habis (Gudang Olsera)</b>
            ) : product.stock <= 15 ? (
              <>Sisa Stok: <b>{product.stock} pcs</b> (Menipis!)</>
            ) : (
              <>Stok: <b>{product.stock} pcs</b> (Tersedia)</>
            )}
          </span>
        </div>

        {/* 3 TOMBOL KAPSUL SEBARIS (CRITICAL SPECIFICATION) */}
        <div className="product-actions-capsule-row">
          {/* Tombol 1: Keranjang */}
          <button
            type="button"
            className={`btn-capsule btn-capsule-cart ${product.stock === 0 ? 'disabled' : ''}`}
            id={`btn-cart-${product.id}`}
            disabled={product.stock === 0}
            onClick={(e) => {
              e.stopPropagation();
              if (product.stock > 0) addToCart(product, 1);
            }}
            style={{
              opacity: product.stock === 0 ? 0.45 : 1,
              cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
            }}
            title={product.stock === 0 ? 'Stok produk habis di gudang' : 'Tambah ke Keranjang'}
          >
            <ShoppingBag size={14} />
            <span style={{ fontSize: '0.72rem' }}>{product.stock === 0 ? 'Habis' : 'Beli'}</span>
          </button>

          {/* Tombol 2: Detail Produk */}
          <button
            type="button"
            className="btn-capsule btn-capsule-detail"
            id={`btn-detail-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(product);
            }}
            title="Lihat Detail Produk Lengkap"
          >
            <Eye size={14} />
            <span style={{ fontSize: '0.72rem' }}>Detail</span>
          </button>

          {/* Tombol 3: Promosikan / Share */}
          <button
            type="button"
            className="btn-capsule btn-capsule-share"
            id={`btn-share-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenShare(product);
            }}
            title="Bagikan / Promosikan Produk"
          >
            <Share2 size={14} />
            <span style={{ fontSize: '0.72rem' }}>Share</span>
          </button>
        </div>
      </div>
    </article>
  );
};
