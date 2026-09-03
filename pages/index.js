import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const defaultTenant = {
  name: "Borba Cordeiros",
  whatsapp: "5547996302864",
  primary_color: "#FF8C00",
  logo_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=150&auto=format&fit=crop&q=80",
  banner_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80"
};

export default function Home() {
  const [tenant, setTenant] = useState(defaultTenant);
  const [categories, setCategories] = useState([{ id: 'all', name: 'Todos' }]);
  const [products, setProducts] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [cart, setCart] = useState([]);
  
  // Checkout
  const [orderType, setOrderType] = useState('delivery');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    streetAndNumber: '',
    reference: '',
    payment: 'PIX'
  });

  const [loadingOrder, setLoadingOrder] = useState(false);

  // Modal State
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [itemObservation, setItemObservation] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: tData } = await supabase.from('tenants').select('*').eq('id', 1).single();
        const { data: cData } = await supabase.from('categories').select('*').eq('tenant_id', 1).order('id', { ascending: true });
        const { data: pData } = await supabase.from('products').select('*').eq('tenant_id', 1).eq('active', true).order('category_id', { ascending: true });
        const { data: nData } = await supabase.from('neighborhoods').select('*').eq('tenant_id', 1).order('id', { ascending: true });

        if (tData) setTenant(tData);
        if (cData && cData.length > 0) setCategories([{ id: 'all', name: 'Todos' }, ...cData]);
        if (pData && pData.length > 0) setProducts(pData);
        if (nData && nData.length > 0) {
          setNeighborhoods(nData);
          setSelectedNeighborhood(nData[0]);
        }
      } catch (e) {
        console.log("Erro ao carregar dados do banco");
      }
    }
    loadData();
  }, []);

  const filteredProducts = selectedCategoryId === "all"
    ? products
    : products.filter(p => p.category_id === selectedCategoryId);

  const openProductModal = (product) => {
    setActiveModalProduct(product);
    setSelectedAddons([]);
    setItemObservation("");
    setItemQuantity(1);
  };

  const parseAddons = (str) => {
    if (!str) return [];
    return str.split(',').map(item => {
      const [name, price] = item.split(':');
      return { name: name?.trim(), price: parseFloat(price) || 0 };
    });
  };

  const toggleAddon = (addon) => {
    if (selectedAddons.find(a => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const confirmCustomProduct = () => {
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = Number(activeModalProduct.price) + addonsTotal;
    const finalPrice = unitPrice * itemQuantity;

    let detailsArr = [];
    if (selectedAddons.length > 0) detailsArr.push(`Add: ${selectedAddons.map(a => a.name).join(', ')}`);
    if (itemObservation.trim()) detailsArr.push(`Obs: ${itemObservation.trim()}`);

    setCart([...cart, {
      ...activeModalProduct,
      cartId: Date.now(),
      quantity: itemQuantity,
      unitPrice,
      finalPrice,
      details: detailsArr.join(' | ')
    }]);

    setActiveModalProduct(null);
  };

  const updateCartQuantity = (cartId, delta) => {
    setCart(cart.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        return {
          ...item,
          quantity: newQty,
          finalPrice: item.unitPrice * newQty
        };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.finalPrice, 0);
  const currentDeliveryFee = orderType === 'delivery' ? Number(selectedNeighborhood?.fee || 0) : 0;
  const calculateTotal = () => (calculateSubtotal() + currentDeliveryFee).toFixed(2);

  const sendOrderToWhatsApp = async () => {
    if (cart.length === 0) return alert("Seu carrinho está vazio!");
    if (!customer.name.trim()) return alert("Preencha seu Nome Completo!");
    if (!customer.phone.trim()) return alert("Preencha seu WhatsApp/Telefone!");

    if (orderType === 'delivery') {
      if (!selectedNeighborhood) return alert("Selecione o Bairro para entrega!");
      if (!customer.streetAndNumber.trim()) return alert("Preencha a Rua e o Número da residência!");
    }

    setLoadingOrder(true);

    const subtotal = calculateSubtotal();
    const total = calculateTotal();
    const cleanPhone = customer.phone.replace(/\D/g, '');

    let createdOrderId = null;

    // 1. Gravar Pedido no Supabase
    try {
      const { data, error } = await supabase.from('orders').insert([{
        tenant_id: 1,
        customer_name: customer.name.trim(),
        customer_phone: cleanPhone,
        order_type: orderType,
        neighborhood: orderType === 'delivery' ? selectedNeighborhood?.name : 'Retirada no Balcão',
        address: orderType === 'delivery' ? customer.streetAndNumber.trim() : 'Retirada no Balcão',
        reference: customer.reference.trim(),
        payment_method: customer.payment,
        items: cart,
        subtotal: subtotal,
        delivery_fee: currentDeliveryFee,
        total: parseFloat(total),
        status: 'recebido'
      }]).select('id').single();

      if (error) {
        console.error("Erro no Supabase:", error);
      } else if (data) {
        createdOrderId = data.id;
      }
    } catch (err) {
      console.error("Falha ao salvar pedido:", err);
    }

    setLoadingOrder(false);

    // 2. Formatar e Enviar no WhatsApp do Restaurante
    let itemsSummary = cart.map(item => {
      let line = `• ${item.quantity}x ${item.name} (R$ ${item.finalPrice.toFixed(2)})`;
      if (item.details) line += `\n   └ _${item.details}_`;
      return line;
    }).join('\n');
    
    let addressInfo = orderType === 'delivery' 
      ? `*Tipo:* ENTREGA 🛵\n*Bairro:* ${selectedNeighborhood?.name}\n*Endereço:* ${customer.streetAndNumber}${customer.reference ? `\n*Ref:* ${customer.reference}` : ''}`
      : `*Tipo:* RETIRADA NO BALCÃO 🛍️`;

    const orderTag = createdOrderId ? `PEDIDO #${createdOrderId}` : `NOVO PEDIDO`;

    const message = 
`*${orderTag} - ${tenant.name.toUpperCase()}* 🍔
----------------------------------
*Cliente:* ${customer.name}
*Telefone:* ${customer.phone}
${addressInfo}
*Pagamento:* ${customer.payment}

*ITENS DO PEDIDO:*
${itemsSummary}

----------------------------------
*Subtotal:* R$ ${subtotal.toFixed(2)}
*Taxa de Entrega:* ${orderType === 'delivery' ? `R$ ${currentDeliveryFee.toFixed(2)}` : 'R$ 0,00 (Retirada)'}
*TOTAL DO PEDIDO:* R$ ${total}
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
            onClick={() => setSelectedCategoryId(cat.id)}
            style={{ backgroundColor: selectedCategoryId === cat.id ? tenant.primary_color : '#1F2937' }}
            className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap text-white transition">
            {cat.name}
          </button>
        ))}
      </div>

      {/* Lista de Produtos */}
      <div className="px-4 space-y-4">
        {filteredProducts.map((item) => (
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

      {/* MODAL DE PERSONALIZAÇÃO COM QUANTIDADE */}
      {activeModalProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-end justify-center z-50 p-0">
          <div className="bg-gray-900 w-full max-w-md rounded-t-2xl p-5 border-t border-gray-700 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">{activeModalProduct.name}</h3>
                <p className="text-xs text-gray-400">Personalize seu pedido</p>
              </div>
              <button onClick={() => setActiveModalProduct(null)} className="text-gray-400 font-bold text-lg">✕</button>
            </div>

            {parseAddons(activeModalProduct.addons_list).length > 0 && (
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

            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">Observações do Lanche:</h4>
              <textarea 
                placeholder="Ex: Tirar salada, carne bem passada, sem maionese..."
                rows="2"
                value={itemObservation}
                onChange={(e) => setItemObservation(e.target.value)}
                className="w-full bg-gray-800 text-white p-2.5 rounded-lg text-xs border border-gray-700 focus:outline-none"
              />
            </div>

            {/* SELETOR DE QUANTIDADE DO MODAL */}
            <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl mb-6">
              <span className="text-xs font-bold text-gray-300">Quantidade:</span>
              <div className="flex items-center space-x-3">
                <button 
                  type="button"
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  className="bg-gray-700 text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                  -
                </button>
                <span className="font-bold text-sm w-4 text-center">{itemQuantity}</span>
                <button 
                  type="button"
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                  className="bg-gray-700 text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                  +
                </button>
              </div>
            </div>

            <button 
              onClick={confirmCustomProduct}
              style={{ backgroundColor: tenant.primary_color }}
              className="w-full py-3 text-white font-bold rounded-xl text-sm">
              Adicionar ao Carrinho • R$ {((Number(activeModalProduct.price) + selectedAddons.reduce((sum, a) => sum + a.price, 0)) * itemQuantity).toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {/* CARRINHO COM SELETOR DE QUANTIDADE */}
      {cart.length > 0 && (
        <div className="m-4 mt-8 bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-xl space-y-4">
          <h3 className="font-bold text-md border-b border-gray-800 pb-2 flex justify-between">
            <span>🛒 Seu Carrinho</span>
            <span className="text-xs text-gray-400">{cart.length} itens</span>
          </h3>

          <div className="space-y-2">
            {cart.map((c) => (
              <div key={c.cartId} className="flex justify-between items-center text-xs bg-gray-800 p-2.5 rounded-lg">
                <div className="flex-1 pr-2">
                  <div className="font-bold">{c.name}</div>
                  {c.details && <div className="text-[11px] text-gray-400 mt-0.5">{c.details}</div>}
                  <div className="text-orange-400 font-bold mt-1">R$ {c.finalPrice.toFixed(2)}</div>
                </div>

                <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded-lg border border-gray-700">
                  <button onClick={() => updateCartQuantity(c.cartId, -1)} className="px-2 py-0.5 font-bold text-red-400 text-xs">-</button>
                  <span className="font-bold text-xs">{c.quantity}</span>
                  <button onClick={() => updateCartQuantity(c.cartId, 1)} className="px-2 py-0.5 font-bold text-green-400 text-xs">+</button>
                </div>

                <button onClick={() => removeFromCart(c.cartId)} className="text-red-400 font-bold ml-3 p-1">✕</button>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <label className="text-[11px] text-gray-400 block mb-1.5 font-bold">Como deseja receber seu pedido?</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`py-2.5 px-2 rounded-lg text-xs font-bold border transition ${orderType === 'delivery' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                🛵 Entrega (Delivery)
              </button>
              <button 
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`py-2.5 px-2 rounded-lg text-xs font-bold border transition ${orderType === 'pickup' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                🛍️ Retirar no Balcão
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <input 
              type="text"
              placeholder="Seu Nome Completo" 
              value={customer.name}
              className="w-full bg-gray-800 text-white p-2.5 rounded-lg text-xs border border-gray-700 focus:outline-none" 
              onChange={(e) => setCustomer({...customer, name: e.target.value})}
            />

            <input 
              type="text"
              placeholder="Seu WhatsApp/Telefone (DDD + Número)" 
              value={customer.phone}
              className="w-full bg-gray-800 text-white p-2.5 rounded-lg text-xs border border-gray-700 focus:outline-none" 
              onChange={(e) => setCustomer({...customer, phone: e.target.value})}
            />

            {orderType === 'delivery' && (
              <>
                {neighborhoods.length > 0 && (
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Selecione seu Bairro (Taxa Fixa):</label>
                    <select 
                      className="w-full bg-gray-800 text-white p-2.5 rounded-lg text-xs border border-gray-700 focus:outline-none font-bold"
                      onChange={(e) => setSelectedNeighborhood(neighborhoods[e.target.value])}>
                      {neighborhoods.map((n, idx) => (
                        <option key={n.id} value={idx}>
                          {n.name} (+ R$ {Number(n.fee).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <input 
                  type="text"
                  placeholder="Nome da Rua e Número (Ex: Rua Olavo Bilac, 120)" 
                  value={customer.streetAndNumber}
                  className="w-full bg-gray-800 text-white p-2.5 rounded-lg text-xs border border-gray-700 focus:outline-none" 
                  onChange={(e) => setCustomer({...customer, streetAndNumber: e.target.value})}
                />

                <input 
                  type="text"
                  placeholder="Ponto de Referência / Apto / Bloco (Opcional)" 
                  value={customer.reference}
                  className="w-full bg-gray-800 text-white p-2.5 rounded-lg text-xs border border-gray-700 focus:outline-none" 
                  onChange={(e) => setCustomer({...customer, reference: e.target.value})}
                />
              </>
            )}

            {orderType === 'pickup' && (
              <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg text-xs text-orange-300">
                📍 <b>Retirada no Local:</b> Seu pedido será preparado e você poderá retirar diretamente no balcão do restaurante.
              </div>
            )}

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">Forma de Pagamento:</label>
              <select 
                className="w-full bg-gray-800 text-white p-2.5 rounded-lg text-xs border border-gray-700 focus:outline-none"
                onChange={(e) => setCustomer({ ...customer, payment: e.target.value })}>
                <option value="PIX">Pagamento via PIX</option>
                <option value="Cartão de Crédito/Débito">Cartão na Entrega / Retirada</option>
                <option value="Dinheiro">Dinheiro (Avisar troco nas observações)</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-800 p-3 rounded-lg space-y-1 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal:</span>
              <span>R$ {calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Taxa de Entrega:</span>
              <span className="font-bold text-orange-400">
                {orderType === 'delivery' ? `R$ ${currentDeliveryFee.toFixed(2)}` : 'Grátis (Retirada)'}
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-gray-700">
              <span>Total Final:</span>
              <span style={{ color: tenant.primary_color }}>R$ {calculateTotal()}</span>
            </div>
          </div>

          <button 
            disabled={loadingOrder}
            onClick={sendOrderToWhatsApp} 
            className="w-full py-3.5 bg-green-600 font-bold rounded-xl text-xs hover:bg-green-700 transition flex items-center justify-center space-x-2">
            <span>{loadingOrder ? 'Processando...' : 'Enviar Pedido pelo WhatsApp 🚀'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
