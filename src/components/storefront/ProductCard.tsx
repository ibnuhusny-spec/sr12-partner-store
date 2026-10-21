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
        <div
          className={`product-stock-pill ${product.stock === 0 ? 'stock-empty' : product.stock <= 15 ? 'stock-warning' : 'stock-ready'}`}
          title={`Status Stok Gudang Olsera: ${product.stock} pcs`}
        >
          <span className="stock-dot-pulse" />
          <span className="stock-pill-text">
            {product.stock === 0 ? (
              'Habis'
            ) : product.stock <= 15 ? (
              <>Sisa <b>{product.stock}</b></>
            ) : (
              <>Stok <b>{product.stock}</b></>
            )}
          </span>
        </div>

        {/* 3 TOMBOL KAPSUL SEBARIS (OPTIMIZED FOR 2-COLUMN MOBILE & DESKTOP) */}
        <div className="product-actions-capsule-row">
          {/* Tombol 1: Keranjang / Beli */}
          <button
            type="button"
            className={`btn-capsule btn-capsule-cart ${product.stock === 0 ? 'disabled' : ''}`}
            id={`btn-cart-${product.id}`}
            disabled={product.stock === 0}
            onClick={(e) => {
              e.stopPropagation();
              if (product.stock > 0) addToCart(product, 1);
            }}
            title={product.stock === 0 ? 'Stok produk habis di gudang' : 'Tambah ke Keranjang'}
            aria-label="Beli Produk"
          >
            <ShoppingBag size={13} />
            <span className="capsule-text">{product.stock === 0 ? 'Habis' : 'Beli'}</span>
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
            aria-label="Lihat Detail Produk"
          >
            <Eye size={14} />
            <span className="capsule-text hide-on-mobile-col">Detail</span>
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
            aria-label="Bagikan Produk"
          >
            <Share2 size={13} />
            <span className="capsule-text hide-on-mobile-col">Share</span>
          </button>
        </div>
      </div>
    </article>
  );
};

