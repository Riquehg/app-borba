import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const defaultTenant = {
  name: "Borba Cordeiros",
  whatsapp: "5547999999999",
  primary_color: "#FF8C00",
  logo_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=150&auto=format&fit=crop&q=80",
  banner_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80"
};

export default function Home() {
  const [tenant, setTenant] = useState(defaultTenant);
  const [categories, setCategories] = useState([{ id: 'all', name: 'Todos' }]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', address: '', payment: 'PIX' });

  // Modal State
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [removedIngredients, setRemovedIngredients] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: tData } = await supabase.from('tenants').select('*').eq('id', 1).single();
        const { data: pData } = await supabase.from('products').select('*').eq('tenant_id', 1).eq('active', true);
        const { data: cData } = await supabase.from('categories').select('*').eq('tenant_id', 1);

        if (tData) setTenant(tData);
        if (pData && pData.length > 0) setProducts(pData);
        if (cData && cData.length > 0) setCategories([{ id: 'all', name: 'Todos' }, ...cData]);
      } catch (e) {
        console.log("Erro de carregamento");
      }
    }
    loadData();
  }, []);

  const openProductModal = (product) => {
    if (!product.addons_list && !product.removals_list) {
      setCart([...cart, { ...product, cartId: Date.now(), finalPrice: Number(product.price), details: "" }]);
      return;
    }
    setActiveModalProduct(product);
    setSelectedAddons([]);
    setRemovedIngredients([]);
  };

  const parseAddons = (str) => {
    if (!str) return [];
    return str.split(',').map(item => {
      const [name, price] = item.split(':');
      return { name: name?.trim(), price: parseFloat(price) || 0 };
    });
  };

  const parseRemovals = (str) => {
    if (!str) return [];
    return str.split(',').map(item => item.trim());
  };

  const toggleAddon = (addon) => {
    if (selectedAddons.find(a => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const toggleRemoval = (ing) => {
    if (removedIngredients.includes(ing)) {
      setRemovedIngredients(removedIngredients.filter(i => i !== ing));
    } else {
      setRemovedIngredients([...removedIngredients, ing]);
    }
  };

  const confirmCustomProduct = () => {
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const finalPrice = Number(activeModalProduct.price) + addonsTotal;

    let detailsArr = [];
    if (selectedAddons.length > 0) detailsArr.push(`Add: ${selectedAddons.map(a => a.name).join(', ')}`);
    if (removedIngredients.length > 0) detailsArr.push(`Sem: ${removedIngredients.join(', ')}`);

    setCart([...cart, {
      ...activeModalProduct,
      cartId: Date.now(),
      finalPrice,
      details: detailsArr.join(' | ')
    }]);

    setActiveModalProduct(null);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.finalPrice, 0).toFixed(2);

  const sendOrderToWhatsApp = () => {
    if (cart.length === 0) return alert("Seu carrinho está vazio!");
    if (!customer.name || !customer.address) return alert("Preencha seu nome e endereço!");

    let itemsSummary = cart.map(item => {
      let line = `• 1x ${item.name} (R$ ${item.finalPrice.toFixed(2)})`;
      if (item.details) line += `\n   └ _${item.details}_`;
      return line;
    }).join('\n');
    
    const message = 
`*NOVO PEDIDO - ${tenant.name.toUpperCase()}* 🍔
----------------------------------
*Cliente:* ${customer.name}
*Endereço:* ${customer.address}
*Pagamento:* ${customer.payment}

*ITENS DO PEDIDO:*
${itemsSummary}

----------------------------------
*TOTAL DO PEDIDO:* R$ ${calculateTotal()}
----------------------------------`;

    window.open(`https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen max-w-md mx-auto font-sans pb-24 bg-gray-950 text-white">
      {/* Header */}
      <div className="relative">
        <img src={tenant.banner_url} alt="Banner" className="w-full h-36 object-cover" />
        <div className="absolute -bottom-6 left-4">
          <img src={tenant.logo_url} alt="Logo" className="w-16 h-16 rounded-full border-2 border-gray-900 object-cover shadow-lg" />
        </div>
      </div>

      <header className="pt-8 px-4 border-b border-gray-800 pb-4">
        <h1 className="text-xl font-bold" style={{ color: tenant.primary_color }}>{tenant.name}</h1>
        <p className="text-xs text-gray-400 mt-1">Lanches & Petiscos • Entrega Rápida</p>
      </header>

      {/* Categorias */}
      <div className="flex space-x-2 overflow-x-auto p-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            style={{ backgroundColor: selectedCategory === cat.name ? tenant.primary_color : '#1F2937' }}
            className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap text-white">
            {cat.name}
          </button>
        ))}
      </div>

      {/* Lista de Produtos */}
      <div className="px-4 space-y-4">
        {products.map((item) => (
          <div key={item.id} className="bg-gray-900 p-3 rounded-xl flex space-x-3 items-center border border-gray-800">
            <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-sm">{item.name}</h3>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-bold" style={{ color: tenant.primary_color }}>
                  R$ {Number(item.price).toFixed(2)}
                </span>
                <button 
                  onClick={() => openProductModal(item)}
                  style={{ backgroundColor: tenant.primary_color }}
                  className="text-white text-xs px-3 py-1.5 rounded-lg font-bold">
                  Personalizar / + Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE PERSONALIZAÇÃO */}
      {activeModalProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-end justify-center z-50 p-0">
          <div className="bg-gray-900 w-full max-w-md rounded-t-2xl p-5 border-t border-gray-700 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">{activeModalProduct.name}</h3>
                <p className="text-xs text-gray-400">Monte seu lanche abaixo</p>
              </div>
              <button onClick={() => setActiveModalProduct(null)} className="text-gray-400 font-bold text-lg">✕</button>
            </div>

            {/* Adicionais */}
            {activeModalProduct.addons_list && (
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">Deseja Adicionais?</h4>
                <div className="space-y-1.5">
                  {parseAddons(activeModalProduct.addons_list).map((add) => (
                    <label key={add.name} className="flex justify-between items-center bg-gray-800 p-2.5 rounded-lg text-xs cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={!!selectedAddons.find(a => a.name === add.name)}
                          onChange={() => toggleAddon(add)}
                        />
                        <span>{add.name}</span>
                      </div>
                      <span className="text-orange-400 font-bold">+ R$ {add.price.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Remoções */}
            {activeModalProduct.removals_list && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">Retirar Ingredientes</h4>
                <div className="grid grid-cols-2 gap-2">
                  {parseRemovals(activeModalProduct.removals_list).map((ing) => (
                    <label key={ing} className="flex items-center space-x-2 bg-gray-800 p-2.5 rounded-lg text-xs cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={removedIngredients.includes(ing)}
                        onChange={() => toggleRemoval(ing)}
                      />
                      <span>{ing}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={confirmCustomProduct}
              style={{ backgroundColor: tenant.primary_color }}
              className="w-full py-3 text-white font-bold rounded-xl text-sm">
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      )}

      {/* Carrinho */}
      {cart.length > 0 && (
        <div className="m-4 mt-8 bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-xl">
          <h3 className="font-bold text-md mb-3 border-b border-gray-800 pb-2 flex justify-between">
            <span>🛒 Seu Carrinho</span>
            <span className="text-xs text-gray-400">{cart.length} itens</span>
          </h3>
          <div className="space-y-2 mb-4">
            {cart.map((c) => (
              <div key={c.cartId} className="flex justify-between text-xs bg-gray-800 p-2.5 rounded">
                <div>
                  <div className="font-bold">{c.name}</div>
                  {c.details && <div className="text-[11px] text-gray-400 mt-0.5">{c.details}</div>}
                  <div className="text-orange-400 font-bold mt-1">R$ {c.finalPrice.toFixed(2)}</div>
                </div>
                <button onClick={() => removeFromCart(c.cartId)} className="text-red-400 font-bold">✕</button>
              </div>
            ))}
          </div>

          <input 
            placeholder="Seu Nome Completo" 
            className="w-full bg-gray-800 text-white p-2.5 rounded-lg text-xs mb-2 border border-gray-700" 
            onChange={(e) => setCustomer({...customer, name: e.target.value})}
          />
          <input 
            placeholder="Endereço Completo (Rua, Nº, Bairro)" 
            className="w-full bg-gray-800 text-white p-2.5 rounded-lg text-xs mb-3 border border-gray-700" 
            onChange={(e) => setCustomer({...customer, address: e.target.value})}
          />

          <button onClick={sendOrderToWhatsApp} className="w-full py-3.5 bg-green-600 font-bold rounded-xl text-xs">
            Enviar Pedido pelo WhatsApp 🚀
          </button>
        </div>
      )}
    </div>
  );
}
