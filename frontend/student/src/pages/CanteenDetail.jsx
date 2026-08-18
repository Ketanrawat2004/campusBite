import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axiosClient from '../api/client';
import toast from 'react-hot-toast';

const menuCache = new Map();

export default function CanteenDetailPage() {
  const { id: canteenId } = useParams();
  const { dispatch } = useCart();

  const cached = menuCache.get(canteenId);
  const [canteen, setCanteen] = useState(() => cached?.canteen || null);
  const [categories, setCategories] = useState(() => cached?.categories || []);
  const [loading, setLoading] = useState(() => !cached);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [vegOnlyFilter, setVegOnlyFilter] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  // Customization modal state
  const [selectedItemForCustom, setSelectedItemForCustom] = useState(null);
  const [selectedCustomizations, setSelectedCustomizations] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadInitialMenu = async () => {
      try {
        const [canteenRes, menuRes] = await Promise.all([
          axiosClient.get(`/canteens/${canteenId}`),
          axiosClient.get(`/canteens/${canteenId}/menu`),
        ]);
        if (isMounted) {
          const cData = canteenRes.data.data;
          const catData = menuRes.data.data.categories || [];
          menuCache.set(canteenId, { canteen: cData, categories: catData });
          setCanteen(cData);
          setCategories(catData);
        }
      } catch (err) {
        console.error('Fetch canteen error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const pollCanteenStatus = async () => {
      if (document.hidden) return;
      try {
        const canteenRes = await axiosClient.get(`/canteens/${canteenId}`);
        if (isMounted && canteenRes.data?.data) {
          setCanteen(canteenRes.data.data);
        }
      } catch (err) {
        console.error('Poll canteen status error:', err);
      }
    };

    loadInitialMenu();
    const interval = setInterval(pollCanteenStatus, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [canteenId]);

  const formatRupees = (paise) => `₹${(paise / 100).toFixed(2)}`;

  const handleAddToCart = (item, selectedCusts = []) => {
    if (canteen && (!canteen.acceptingOrders || canteen.statusMode === 'OFFLINE')) {
      toast.error('This canteen has currently paused new orders. Check back shortly!');
      return;
    }

    const custPrice = selectedCusts.reduce(
      (sum, c) => sum + (c.additionalPriceInPaise || 0),
      0
    );

    dispatch({
      type: 'ADD_ITEM',
      item: {
        menuItemId: item._id,
        canteenId: canteen._id,
        canteenName: canteen.name,
        name: item.name,
        isVeg: Boolean(item.isVeg),
        priceInPaise: item.priceInPaise,
        customizationPriceInPaise: custPrice,
        customizations: selectedCusts,
        quantity: 1,
        imageUrl: item.imageUrl,
      },
    });

    toast.success(`Added "${item.name}" to cart`);
    setSelectedItemForCustom(null);
    setSelectedCustomizations({});
  };

  const handleOpenCustomModal = (item) => {
    if (item.customizations && item.customizations.length > 0) {
      setSelectedItemForCustom(item);
      const defaults = {};
      item.customizations.forEach((g) => {
        if (g.options && g.options.length > 0) {
          defaults[g.groupName] = g.options[0];
        }
      });
      setSelectedCustomizations(defaults);
    } else {
      handleAddToCart(item);
    }
  };

  if (loading) {
    return (
      <div className="page-container py-6 space-y-6 px-3 sm:px-6 lg:px-8">
        <div className="card h-48 bg-slate-100 animate-pulse rounded-2xl" />
        <div className="card h-96 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!canteen) {
    return (
      <div className="page-container text-center py-16 card px-4 my-8">
        <h2 className="text-xl font-bold text-gray-800">Canteen not found</h2>
      </div>
    );
  }

  // Filter items
  const filteredCategories = categories
    .map((cat) => {
      const items = (cat.items || []).filter((item) => {
        if (vegOnlyFilter && !item.isVeg) return false;
        if (itemSearch && !item.name.toLowerCase().includes(itemSearch.toLowerCase())) {
          return false;
        }
        return true;
      });
      return { ...cat, items };
    })
    .filter((cat) => (activeCategory === 'ALL' || cat._id === activeCategory) && cat.items.length > 0);

  return (
    <div className="page-container py-4 sm:py-6 space-y-5 sm:space-y-6 animate-fade-in px-3 sm:px-6 lg:px-8">
      {/* Canteen Header Card */}
      <section className="card p-4 sm:p-6 md:p-8 relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white shadow-lg rounded-2xl sm:rounded-3xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {canteen.statusMode === 'BUSY' ? (
                <span className="bg-amber-500 text-white font-extrabold text-[10px] sm:text-xs px-2.5 py-1 rounded-full shadow-md animate-pulse">
                  ⚡ PEAK RUSH HOUR
                </span>
              ) : canteen.acceptingOrders && canteen.statusMode !== 'OFFLINE' ? (
                <span className="badge badge-green text-[10px] sm:text-xs">
                  ● ONLINE & ACCEPTING ORDERS
                </span>
              ) : (
                <span className="badge badge-red text-[10px] sm:text-xs">
                  🚫 QUEUE PAUSED / OFFLINE
                </span>
              )}
              {canteen.rating?.average > 0 && (
                <span className="text-[10px] sm:text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                  ★ {canteen.rating.average.toFixed(1)} ({canteen.rating.count} reviews)
                </span>
              )}
            </div>

            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-display font-extrabold">{canteen.name}</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">{canteen.description}</p>
            <p className="text-xs text-slate-400 font-medium">📍 {canteen.location?.name || 'Main Campus'}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-center border border-white/10 flex-shrink-0 self-start sm:self-center">
            <div className="text-xl sm:text-2xl font-display font-bold text-orange-400">
              ⚡ {canteen.statusMode === 'BUSY' ? '30 mins (Rush)' : `${canteen.avgPrepTimeMinutes || 15} mins`}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5">Average Preparation Time</div>
          </div>
        </div>

        {/* Live Operating Status Banners */}
        {canteen.statusMode === 'BUSY' && (
          <div className="mt-4 p-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-200 text-xs font-semibold flex items-center gap-2">
            <span>⚡</span>
            <span><strong>Kitchen Rush Hour Active:</strong> Canteen is experiencing heavy demand. Orders are being accepted, but prep times are currently ~30 minutes.</span>
          </div>
        )}

        {(!canteen.acceptingOrders || canteen.statusMode === 'OFFLINE') && (
          <div className="mt-4 p-3 bg-rose-500/20 border border-rose-400/40 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2">
            <span>🚫</span>
            <span><strong>Kitchen Queue Paused:</strong> This canteen has temporarily paused new orders to clear existing kitchen queue. Please check back shortly.</span>
          </div>
        )}
      </section>

      {/* Filter Bar & Category Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Category Scroll Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === 'ALL'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Items
          </button>

          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat._id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.name} ({cat.items?.length || 0})
            </button>
          ))}
        </div>

        {/* Veg Toggle & Search */}
        <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
          <button
            onClick={() => setVegOnlyFilter(!vegOnlyFilter)}
            className={`btn btn-sm ${vegOnlyFilter ? 'bg-emerald-600 text-white' : 'btn-secondary'} whitespace-nowrap text-xs py-1.5 px-3`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1" />
            Veg Only
          </button>
          <input
            type="text"
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            placeholder="Filter menu..."
            className="input text-xs py-1.5 px-3 w-36 sm:w-48"
          />
        </div>
      </div>

      {/* Menu Categories & Items List */}
      <div className="space-y-6 sm:space-y-8">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 card p-4">
            <span className="text-4xl opacity-40">🥗</span>
            <h3 className="text-base font-bold text-slate-700 mt-2">No menu items match your filter</h3>
            <p className="text-xs text-slate-400 mt-1">Try clearing veg filter or search term.</p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <section key={cat._id} className="space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-display font-bold text-slate-900 border-l-4 border-orange-600 pl-3">
                {cat.name}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {cat.items.map((item) => (
                  <div
                    key={item._id}
                    className="card p-3.5 sm:p-4 flex gap-3 sm:gap-4 items-start justify-between hover:border-slate-300 transition-all shadow-sm"
                  >
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                          item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                          }`} />
                        </span>
                        {item.tags?.includes('bestseller') && (
                          <span className="badge badge-orange text-[10px]">🔥 Bestseller</span>
                        )}
                      </div>

                      <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base leading-tight">
                        {item.name}
                      </h3>

                      <p className="text-[11px] sm:text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>

                      <div className="flex items-center gap-2 mt-2 sm:mt-3">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900">
                          {formatRupees(item.priceInPaise)}
                        </span>
                        {item.originalPriceInPaise > item.priceInPaise && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatRupees(item.originalPriceInPaise)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Image & Add Button */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80';
                          }}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl sm:text-3xl">
                          🍱
                        </div>
                      )}

                      <button
                        onClick={() => handleOpenCustomModal(item)}
                        disabled={!item.isAvailable || !canteen.acceptingOrders}
                        className="btn btn-primary btn-sm w-full py-1.5 shadow-sm text-xs font-bold"
                      >
                        {!canteen.acceptingOrders
                          ? 'Closed'
                          : !item.isAvailable
                          ? 'Sold Out'
                          : item.customizations?.length > 0
                          ? 'Add + (Custom)'
                          : 'ADD +'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Customization Modal */}
      {selectedItemForCustom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base sm:text-lg font-display font-bold text-slate-900">
                  Customize "{selectedItemForCustom.name}"
                </h3>
                <p className="text-xs text-slate-500">Select options below</p>
              </div>
              <button
                onClick={() => setSelectedItemForCustom(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Customization Groups */}
            <div className="space-y-3 sm:space-y-4 max-h-60 overflow-y-auto pr-1">
              {selectedItemForCustom.customizations.map((group) => (
                <div key={group.groupName} className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    {group.groupName}
                  </label>
                  <div className="space-y-1.5">
                    {group.options.map((opt) => {
                      const isSelected = selectedCustomizations[group.groupName]?.name === opt.name;
                      return (
                        <label
                          key={opt.name}
                          onClick={() =>
                            setSelectedCustomizations({
                              ...selectedCustomizations,
                              [group.groupName]: opt,
                            })
                          }
                          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-colors text-xs sm:text-sm ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50 text-orange-950 font-semibold'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span>{opt.name}</span>
                          <span className="text-xs font-bold text-orange-600">
                            {opt.additionalPriceInPaise > 0
                              ? `+${formatRupees(opt.additionalPriceInPaise)}`
                              : 'Free'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2 sm:gap-3">
              <button
                onClick={() => setSelectedItemForCustom(null)}
                className="btn btn-secondary flex-1 text-xs sm:text-sm py-2"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleAddToCart(
                    selectedItemForCustom,
                    Object.entries(selectedCustomizations).map(([g, opt]) => ({
                      groupName: g,
                      selectedOption: opt.name,
                      additionalPriceInPaise: opt.additionalPriceInPaise,
                    }))
                  )
                }
                className="btn btn-primary flex-1 text-xs sm:text-sm py-2"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
