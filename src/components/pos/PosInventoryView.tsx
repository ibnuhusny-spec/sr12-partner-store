import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { uploadProductImageFile, setAllStoreProductsStock, syncStoreCatalogFromCloud } from '../../services/catalogService';
import { clearAllStockMutations } from '../../services/posService';
import { SR12_MASTER_CATALOG } from '../../data/sr12MasterCatalog';
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  Send,
  Check,
  X,
  Edit3,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Search,
  Filter,
  Loader2,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface PosInventoryViewProps {
  products: Product[];
  onUpdateStock: (productId: string, newStock: number) => void;
  onUpdateProduct: (product: Product) => void;
  onResetCatalogToMaster?: () => void;
}

export const PosInventoryView: React.FC<PosInventoryViewProps> = ({
  products,
  onUpdateStock,
  onUpdateProduct,
  onResetCatalogToMaster
}) => {
  const { currentStore } = useApp();
  const [filter, setFilter] = useState<'all' | 'warning' | 'empty'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState(50);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    het: number;
    stock: number;
    weightGram: number;
    image: string;
    summary: string;
  } | null>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filtered = products.filter(p => {
    if (filter === 'warning' && (p.stock <= 0 || p.stock > 15)) return false;
    if (filter === 'empty' && p.stock > 0) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 15).length;
  const emptyStockCount = products.filter(p => p.stock === 0).length;

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleOpenEdit = (p: Product) => {
    setEditProduct(p);
    setUploadError(null);
    setEditForm({
      name: p.name,
      het: p.het,
      stock: p.stock,
      weightGram: p.weightGram || 100,
      image: p.image,
      summary: p.summary || ''
    });
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editForm || !editProduct) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file gambar maksimal 5 MB!');
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const publicUrl = await uploadProductImageFile(file, currentStore.slug, editProduct.id);
      setEditForm(prev => prev ? { ...prev, image: publicUrl } : null);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setUploadError(err.message || 'Gagal mengunggah foto ke Cloud Supabase');
      alert(`Gagal mengunggah foto: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleResetToStandardImage = () => {
    if (!editProduct || !editForm) return;
    const master = SR12_MASTER_CATALOG.find(m => m.id === editProduct.id || m.sku === editProduct.sku);
    if (master) {
      setEditForm({ ...editForm, image: master.image });
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct || !editForm) return;

    const updated: Product = {
      ...editProduct,
      name: editForm.name,
      het: editForm.het,
      price: editForm.het,
      stock: editForm.stock,
      weightGram: editForm.weightGram,
      image: editForm.image,
      summary: editForm.summary
    };

    onUpdateProduct(updated);
    setEditProduct(null);
    setEditForm(null);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3500);
  };

  const handleSendRestockOrder = () => {
    if (!restockProduct) return;
    const estCost = (restockProduct.het * 0.5) * restockQty; // 50% distributor modal
    const waMsg = `*ORDER RESTOCK PRODUK KE PT SR12 PUSAT* 📦
Dari: *${currentStore.storeName}* (${currentStore.storeCity})
Pemilik: ${currentStore.storeOwner}

Produk: *${restockProduct.name}*
SKU: ${restockProduct.sku}
Jumlah Restock: *${restockQty} pcs*
Estimasi Modal Distributor (50%): Rp ${estCost.toLocaleString('id-ID')}

Mohon segera diproses pengirimannya dari gudang pusat PT SR12. Terima kasih! 🙏`;

    window.open(`https://wa.me/6281200001212?text=${encodeURIComponent(waMsg)}`, '_blank');
    setRestockProduct(null);
  };

  const handleSetAllStock = (targetStock: number) => {
    if (confirm(`Apakah Anda yakin ingin menyetel stok SEMUA (${products.length}) produk toko ini menjadi ${targetStock} pcs?`)) {
      const updated = setAllStoreProductsStock(currentStore.slug, targetStock);
      updated.forEach(p => onUpdateStock(p.id, targetStock));
      alert(`Stok semua produk berhasil diubah menjadi ${targetStock} pcs!`);
    }
  };

  const handleClearMutations = () => {
    if (confirm('Bersihkan seluruh riwayat mutasi stok toko ini?')) {
      clearAllStockMutations(currentStore.slug);
      alert('Riwayat mutasi stok berhasil dibersihkan!');
    }
  };

  return (
    <div style={{ padding: '20px', background: '#0b1329', minHeight: 'calc(100vh - 65px)', color: '#f8fafc' }}>
      {/* Save Toast Notification */}
      {showSaveToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #059669, #10b981)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 700,
          fontSize: '0.86rem'
        }}>
          <Check size={18} />
          <span>Gambar &amp; Info Produk Khusus <b>{currentStore.storeName}</b> Berhasil Diperbarui!</span>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div
          onClick={() => setFilter('all')}
          style={{
            background: '#1e293b',
            border: filter === 'all' ? '2px solid #38bdf8' : '1px solid #334155',
            padding: '14px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>Total SKU Toko Ini</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc' }}>{products.length} Item</div>
          <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Katalog Terisolasi {currentStore.storeName}</div>
        </div>

        <div
          onClick={() => setFilter('warning')}
          style={{
            background: '#1e293b',
            border: filter === 'warning' ? '2px solid #f59e0b' : '1px solid #334155',
            padding: '14px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 700 }}>⚠️ Stok Menipis (&le; 15 pcs)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b' }}>{lowStockCount} Item</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Perlu Restock ke PT SR12</div>
        </div>

        <div
          onClick={() => setFilter('empty')}
          style={{
            background: '#1e293b',
            border: filter === 'empty' ? '2px solid #ef4444' : '1px solid #334155',
            padding: '14px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 700 }}>⛔ Stok Habis (0 pcs)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444' }}>{emptyStockCount} Item</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Segera Order Ulang</div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filter, Reset */}
      <div style={{
        background: '#1e293b',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid #334155',
        marginBottom: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              placeholder="Cari produk / SKU / kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.82rem'
              }}
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#38bdf8',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            {categories.map(c => (
              <option key={c} value={c}>
                {c === 'all' ? 'Semua Kategori (160+ Item)' : c}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Reset & Clear Controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={async () => {
              setIsSyncing(true);
              try {
                const refreshed = await syncStoreCatalogFromCloud(currentStore.slug);
                if (refreshed && typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('sr12:stock_updated', { detail: { storeSlug: currentStore.slug } }));
                }
              } finally {
                setIsSyncing(false);
              }
            }}
            style={{
              background: '#0f172a',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Tarik stok terbaru langsung dari Supabase Cloud"
          >
            <RefreshCw size={14} className={isSyncing ? 'spin-animate' : ''} />
            <span>Segarkan Stok Cloud</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetAllStock(0)}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Kosongkan seluruh stok produk toko ini menjadi 0 pcs untuk simulasi habis"
          >
            <Package size={14} />
            <span className="hide-on-mobile">Kosongkan Semua Stok (0 pcs)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetAllStock(50)}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '8px 10px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Setel stok semua produk menjadi 50 pcs"
          >
            <Check size={14} />
            <span className="hide-on-mobile">Setel Semua Stok (50 pcs)</span>
          </button>

          <button
            type="button"
            onClick={handleClearMutations}
            style={{
              background: '#0f172a',
              border: '1px solid #475569',
              color: '#94a3b8',
              padding: '8px 10px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Hapus riwayat mutasi stok keluar-masuk"
          >
            <Trash2 size={14} />
            <span className="hide-on-mobile">Bersihkan Mutasi</span>
          </button>

          {onResetCatalogToMaster && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Yakin ingin mereset seluruh katalog ${currentStore.storeName} kembali ke Master Data resmi SR12?`)) {
                  onResetCatalogToMaster();
                }
              }}
              style={{
                background: '#0f172a',
                border: '1px solid #475569',
                color: '#38bdf8',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Kloning ulang 160+ produk resmi dari Master SR12"
            >
              <RotateCcw size={14} />
              <span className="hide-on-mobile">Reset Master SR12</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
              Inventori &amp; Katalog Khusus {currentStore.storeName}
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Menampilkan {filtered.length} dari {products.length} SKU terdaftar • Edit foto &amp; harga berlaku khusus toko ini
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '10px 14px' }}>Produk &amp; Foto</th>
                <th style={{ padding: '10px 14px' }}>Kategori</th>
                <th style={{ padding: '10px 14px' }}>HET Resmi</th>
                <th style={{ padding: '10px 14px' }}>Status Olsera</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Sisa Stok</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                let badge = <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>🟢 Ready</span>;
                if (p.stock === 0) {
                  badge = <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>🔴 Habis</span>;
                } else if (p.stock <= 15) {
                  badge = <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>🟡 Menipis (⚠️)</span>;
                }

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #334155' }}
                          loading="lazy"
                        />
                        <div>
                          <div style={{ fontWeight: 800, color: '#f8fafc' }}>{p.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.sku} &bull; {p.netto}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{p.category}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#38bdf8' }}>Rp {p.het.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '10px 14px' }}>{badge}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 900, fontSize: '0.92rem' }}>{p.stock} pcs</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#047857',
                            color: '#fff',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                          title="Edit Foto &amp; Info Produk Khusus Toko Ini"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>

                        {/* Stock Controls */}
                        <button
                          type="button"
                          onClick={() => onUpdateStock(p.id, Math.max(0, p.stock - 1))}
                          style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#334155', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Kurangi Stok 1"
                        >
                          <Minus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateStock(p.id, p.stock + 1)}
                          style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#334155', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Tambah Stok 1"
                        >
                          <Plus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRestockProduct(p)}
                          style={{ padding: '4px 8px', borderRadius: '6px', background: '#0369a1', color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}
                          title="Buat Order Restock ke PT SR12"
                        >
                          Restock
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL EDIT PRODUK KHUSUS TOKO (MULTI-TENANT ISOLATION) */}
      {/* ==================================================== */}
      {editProduct && editForm && (
        <div className="modal-overlay" onClick={() => setEditProduct(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', background: '#1e293b', color: '#fff', borderRadius: '14px', border: '1px solid #334155', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Edit Produk Khusus Toko</h3>
                <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                  Toko: <b>{currentStore.storeName}</b>
                </span>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setEditProduct(null)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Isolation Alert Banner */}
              <div style={{
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#bae6fd'
              }}>
                🔒 <b>Katalog Terisolasi:</b> Foto dan perubahan data ini hanya akan tampil di toko <b>{currentStore.storeName}</b> dan TIDAK AKAN mengubah produk di toko mitra lain.
              </div>

              {/* Image Preview & Upload Section */}
              <div>
                <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Foto Produk Khusus Toko:
                </label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <img
                    src={editForm.image}
                    alt="Preview"
                    style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: '2px solid #38bdf8',
                      background: '#0f172a'
                    }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* File Upload Button */}
                    {isUploadingImage ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: '#0c4a6e',
                        color: '#38bdf8',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: '1px solid #0284c7'
                      }}>
                        <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Mengunggah ke Cloud Supabase...</span>
                      </div>
                    ) : (
                      <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: '#334155',
                        color: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: '1px solid #475569'
                      }}>
                        <Upload size={14} />
                        <span>Unggah Foto dari HP / PC</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleImageFileUpload}
                        />
                      </label>
                    )}

                    {/* Status Pill Cloud */}
                    {editForm.image.includes('supabase.co') && (
                      <div style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                        <Check size={12} />
                        <span>Foto Tersimpan di Cloud Supabase (Aman &amp; Permanen)</span>
                      </div>
                    )}

                    {/* URL Input */}
                    <input
                      type="text"
                      placeholder="Atau tempel URL gambar (https://...)"
                      value={editForm.image.startsWith('data:') ? '' : editForm.image}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        color: '#fff',
                        fontSize: '0.75rem'
                      }}
                    />

                    {/* Reset to standard factory photo button */}
                    <button
                      type="button"
                      onClick={handleResetToStandardImage}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '0.72rem',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: 0
                      }}
                    >
                      ↺ Kembalikan ke Foto Asli Pabrik SR12
                    </button>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  Nama Tampilan Produk:
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              {/* Price & Stock Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    HET / Harga Jual (Rp):
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={500}
                    value={editForm.het}
                    onChange={(e) => setEditForm({ ...editForm, het: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#38bdf8',
                      fontWeight: 800,
                      fontSize: '0.86rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    Jumlah Stok (pcs):
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '0.86rem'
                    }}
                  />
                </div>
              </div>

              {/* Weight */}
              <div>
                <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  Berat Ekspedisi (gram):
                </label>
                <input
                  type="number"
                  min={10}
                  value={editForm.weightGram}
                  onChange={(e) => setEditForm({ ...editForm, weightGram: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              {/* Summary / Description */}
              <div>
                <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  Deskripsi / Manfaat Produk:
                </label>
                <textarea
                  rows={3}
                  value={editForm.summary}
                  onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '0.8rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#334155',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.84rem'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  style={{
                    flex: 2,
                    padding: '10px',
                    background: isUploadingImage
                      ? '#475569'
                      : 'linear-gradient(135deg, #059669, #047857)',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: isUploadingImage ? 0.7 : 1,
                    cursor: isUploadingImage ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isUploadingImage ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Check size={16} />
                  )}
                  <span>{isUploadingImage ? 'Mengunggah Foto Cloud...' : 'Simpan Khusus Toko Ini'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Restock PT SR12 */}
      {restockProduct && (
        <div className="modal-overlay" onClick={() => setRestockProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', background: '#1e293b', color: '#fff' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Restock ke PT SR12 Pusat</h3>
              <button type="button" className="btn-close-modal" onClick={() => setRestockProduct(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Produk yang Direstock:</div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{restockProduct.name}</div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Jumlah Restock (pcs):</label>
                <input
                  type="number"
                  min={10}
                  step={10}
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Estimasi Modal Distributor (50% HET):</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38bdf8' }}>
                  Rp {((restockProduct.het * 0.5) * restockQty).toLocaleString('id-ID')}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendRestockOrder}
                style={{
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Send size={15} />
                <span>Kirim Format Order ke WA Pusat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
