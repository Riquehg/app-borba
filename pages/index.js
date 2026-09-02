import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const defaultTenant = {
  name: "Borba Cordeiros",
  whatsapp: "5547999999999",
  primary_color: "#FF8C00",
  logo_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=150&auto=format&fit=crop&q=80",
  banner_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80"
};

const defaultProducts = [
  {
    id: 1,
    name: "X-Salada Especial Borba",
    description: "Pão brioche, hambúrguer artesanal 160g, queijo cheddar, alface, tomate e maionese da casa.",
    price: 24.90,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    name: "Porção de Batata com Cheddar e Bacon",
    description: "500g de batata frita crocante coberta com molho cheddar e bacon em cubos.",
    price: 38.00,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&auto=format&fit=crop&q=80"
  }
];

export default function Home() {
  const [tenant, setTenant] = useState(defaultTenant);
  const [categories, setCategories] = useState([{ id: 'all', name: 'Todos' }, { id: 1, name: 'Hambúrgueres' }, { id: 2, name: 'Porções' }]);
  const [products, setProducts] = useState(defaultProducts);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', address: '', payment: 'PIX' });

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
        console.log("Carregando com dados padrão");
      }
    }
    loadData();
  }, []);

  const addToCart = (product) => {
    setCart([...cart, { ...product, cartId: Date.now(), finalPrice: Number(product.price) }]);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.finalPrice, 0).toFixed(2);

  const sendOrderToWhatsApp = () => {
    if (cart.length === 0) return alert("Seu carrinho está vazio!");
    if (!customer.name || !customer.address) return alert("Preencha seu nome e endereço!");

    let itemsSummary = cart.map(item => `• 1x ${item.name} (R$ ${item.finalPrice.toFixed(2)})`).join('\n');
    
    const message = 
`*NOVO PEDIDO - ${tenant.name.toUpperCase()}* 🍔
----------------------------------
*Cliente:* ${customer.name}
*Endereço:* ${customer.address}
*Pagamento:* ${customer.payment}

*ITENS DO PEDIDO:*
${itemsSummary}

*TOTAL:* R$ ${calculateTotal()}
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

      {/* Produtos */}
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
                  onClick={() => addToCart(item)}
                  style={{ backgroundColor: tenant.primary_color }}
                  className="text-white text-xs px-3 py-1.5 rounded-lg font-bold">
                  + Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Carrinho */}
      {cart.length > 0 && (
        <div className="m-4 mt-8 bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-xl">
          <h3 className="font-bold text-md mb-3 border-b border-gray-800 pb-2 flex justify-between">
            <span>🛒 Seu Carrinho</span>
            <span className="text-xs text-gray-400">{cart.length} itens</span>
          </h3>
          <div className="space-y-2 mb-4">
            {cart.map((c) => (
              <div key={c.cartId} className="flex justify-between text-xs bg-gray-800 p-2 rounded">
                <span>{c.name}</span>
                <div className="space-x-2">
                  <span className="text-orange-400">R$ {c.finalPrice.toFixed(2)}</span>
                  <button onClick={() => removeFromCart(c.cartId)} className="text-red-400">✕</button>
                </div>
              </div>
            ))}
          </div>

          <input 
            placeholder="Seu Nome" 
            className="w-full bg-gray-800 text-white p-2 rounded text-xs mb-2" 
            onChange={(e) => setCustomer({...customer, name: e.target.value})}
          />
          <input 
            placeholder="Endereço Completo" 
            className="w-full bg-gray-800 text-white p-2 rounded text-xs mb-3" 
            onChange={(e) => setCustomer({...customer, address: e.target.value})}
          />

          <button onClick={sendOrderToWhatsApp} className="w-full py-3 bg-green-600 font-bold rounded-xl text-xs">
            Enviar Pedido pelo WhatsApp 🚀
          </button>
        </div>
      )}
    </div>
  );
}
