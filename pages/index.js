import React, { useState } from 'react';

// Configurações do Cliente (Borba Cordeiros)
const clientConfig = {
  name: "Borba Cordeiros",
  logo: "https://storage.googleapis.com/prod-cardapio-web/uploads/company/logo/34208/8587d992WhatsApp_Image_2026-06-05_at_10.32.49.jpeg",
  banner: "https://storage.googleapis.com/prod-cardapio-web/uploads/company/image/34208/54f8b26fWhatsApp_Image_2026-06-05_at_10.27.33.jpeg",
  whatsapp: "5547999999999", // Insira o WhatsApp da loja
  primaryColor: "#FF8C00",
  backgroundColor: "#121212",
  textColor: "#FFFFFF",
  categories: ["Todos", "Hambúrgueres", "Porções", "Bebidas"]
};

// Tabela de Bairros & Taxas de Entrega
const neighborhoods = [
  { name: "Cordeiros", fee: 5.00 },
  { name: "São Vicente", fee: 7.00 },
  { name: "Dom Bosco", fee: 8.00 },
  { name: "Centro", fee: 10.00 },
  { name: "Fazenda", fee: 12.00 },
  { name: "Retirada no Balcão (Sem Taxa)", fee: 0.00 }
];

// Produtos com Opcionais
const products = [
  {
    id: 1,
    name: "X-Salada Especial Borba",
    category: "Hambúrgueres",
    description: "Pão brioche, hambúrguer artesanal 160g, queijo cheddar, alface, tomate e maionese da casa.",
    price: 24.90,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80",
    hasOptions: true,
    optionGroups: [
      {
        title: "Ponto da Carne",
        required: true,
        options: ["Ao Ponto", "Bem Passado", "Selado (Mal Passado)"]
      },
      {
        title: "Deseja Adicionais?",
        required: false,
        options: [
          { name: "Bacon Extra", price: 4.50 },
          { name: "Queijo Cheddar Extra", price: 3.50 },
          { name: "Hambúrguer Extra 160g", price: 8.00 }
        ]
      },
      {
        title: "Retirar Ingredientes",
        required: false,
        options: ["Sem Cebola", "Sem Tomate", "Sem Maionese", "Sem Salada"]
      }
    ]
  },
  {
    id: 2,
    name: "Porção de Batata com Cheddar e Bacon",
    category: "Porções",
    description: "500g de batata frita crocante coberta com molho cheddar e bacon em cubos.",
    price: 38.00,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&auto=format&fit=crop&q=80",
    hasOptions: false
  },
  {
    id: 3,
    name: "Coca-Cola Zero 350ml",
    category: "Bebidas",
    description: "Lata 350ml trincando de gelada.",
    price: 6.50,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80",
    hasOptions: false
  }
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [cart, setCart] = useState([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(neighborhoods[0]);
  const [customer, setCustomer] = useState({ name: '', address: '', payment: 'PIX', notes: '' });

  // Modal de Personalização
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [selectedMeatPoint, setSelectedMeatPoint] = useState("");
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [removedIngredients, setRemovedIngredients] = useState([]);

  const filteredProducts = selectedCategory === "Todos" 
    ? products 
    : products.filter(item => item.category === selectedCategory);

  const openCustomizer = (product) => {
    if (!product.hasOptions) {
      setCart([...cart, { ...product, cartId: Date.now(), finalPrice: product.price, details: "" }]);
      return;
    }
    setActiveModalProduct(product);
    setSelectedMeatPoint(product.optionGroups[0]?.options[0] || "");
    setSelectedAddons([]);
    setRemovedIngredients([]);
  };

  const toggleAddon = (addon) => {
    if (selectedAddons.find(a => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const toggleRemoved = (ing) => {
    if (removedIngredients.includes(ing)) {
      setRemovedIngredients(removedIngredients.filter(i => i !== ing));
    } else {
      setRemovedIngredients([...removedIngredients, ing]);
    }
  };

  const confirmCustomProduct = () => {
    const addonsTotal = selectedAddons.reduce((sum, item) => sum + item.price, 0);
    const finalPrice = activeModalProduct.price + addonsTotal;

    let detailsArr = [];
    if (selectedMeatPoint) detailsArr.push(`Ponto: ${selectedMeatPoint}`);
    if (selectedAddons.length > 0) detailsArr.push(`Add: ${selectedAddons.map(a => a.name).join(', ')}`);
    if (removedIngredients.length > 0) detailsArr.push(`Sem: ${removedIngredients.join(', ')}`);

    const cartItem = {
      ...activeModalProduct,
      cartId: Date.now(),
      finalPrice: finalPrice,
      details: detailsArr.join(' | ')
    };

    setCart([...cart, cartItem]);
    setActiveModalProduct(null);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.finalPrice, 0);
  };

  const calculateTotal = () => {
    return (calculateSubtotal() + selectedNeighborhood.fee).toFixed(2);
  };

  const scrollToCheckout = () => {
    const el = document.getElementById("checkout-section");
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const sendOrderToWhatsApp = () => {
    if (cart.length === 0) return alert("Seu carrinho está vazio!");
    if (!customer.name || !customer.address) return alert("Preencha seu nome e endereço!");

    let itemsSummary = cart.map(item => {
      let text = `• 1x ${item.name} (R$ ${item.finalPrice.toFixed(2)})`;
      if (item.details) text += `\n   └ _${item.details}_`;
      return text;
    }).join('\n');
    
    const message = 
`*NOVO PEDIDO - ${clientConfig.name.toUpperCase()}* 🍔
----------------------------------
*Cliente:* ${customer.name}
*Endereço:* ${customer.address} (${selectedNeighborhood.name})
*Pagamento:* ${customer.payment}

*ITENS DO PEDIDO:*
${itemsSummary}

----------------------------------
*Subtotal:* R$ ${calculateSubtotal().toFixed(2)}
*Taxa de Entrega (${selectedNeighborhood.name}):* R$ ${selectedNeighborhood.fee.toFixed(2)}
*TOTAL DO PEDIDO:* R$ ${calculateTotal()}
----------------------------------
*Obs:* ${customer.notes || 'Nenhuma'}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${clientConfig.whatsapp}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div style={{ backgroundColor: clientConfig.backgroundColor, color: clientConfig.textColor }} className="min-h-screen max-w-md mx-auto font-sans pb-24">
      
      {/* Banner & Header */}
      <div className="relative">
        <img src={clientConfig.banner} alt="Banner" className="w-full h-36 object-cover" />
        <div className="absolute -bottom-6 left-4 flex items-end space-x-3">
          <img src={clientConfig.logo} alt="Logo" className="w-16 h-16 rounded-full border-2 border-gray-900 object-cover shadow-lg" />
        </div>
      </div>

      <header className="pt-8 px-4 border-b border-gray-800 pb-4">
        <h1 className="text-xl font-bold" style={{ color: clientConfig.primaryColor }}>
          {clientConfig.name}
        </h1>
        <p className="text-xs text-gray-400 mt-1">Lanches & Petiscos • Entrega Rápida</p>
      </header>

      {/* Categorias */}
      <div className="flex space-x-2 overflow-x-auto p-4 scrollbar-hide">
        {clientConfig.categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              backgroundColor: selectedCategory === cat ? clientConfig.primaryColor : '#1F2937',
              color: '#FFFFFF'
            }}
            className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition">
            {cat}
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
                <span className="text-sm font-bold" style={{ color: clientConfig.primaryColor }}>
                  R$ {item.price.toFixed(2)}
                </span>
                <button 
                  onClick={() => openCustomizer(item)}
                  style={{ backgroundColor: clientConfig.primaryColor }}
                  className="text-white text-xs px-3 py-1.5 rounded-lg font-bold">
                  {item.hasOptions ? 'Monte seu Lanche' : '+ Add'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DO MONTADOR DE LANCHE */}
      {activeModalProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-end justify-center z-50 p-0 sm:p-4">
          <div className="bg-gray-900 w-full max-w-md rounded-t-2xl p-5 border-t border-gray-700 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">{activeModalProduct.name}</h3>
                <p className="text-xs text-gray-400">Personalize seu pedido abaixo</p>
              </div>
              <button onClick={() => setActiveModalProduct(null)} className="text-gray-400 font-bold text-lg">✕</button>
            </div>

            {/* Opção 1: Ponto da Carne */}
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">Ponto da Carne</h4>
              <div className="space-y-1.5">
                {activeModalProduct.optionGroups[0].options.map((pt) => (
                  <label key={pt} className="flex items-center space-x-2 bg-gray-800 p-2.5 rounded-lg text-xs cursor-pointer">
                    <input 
                      type="radio" 
                      name="meatPoint" 
                      checked={selectedMeatPoint === pt} 
                      onChange={() => setSelectedMeatPoint(pt)}
                    />
                    <span>{pt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Opção 2: Adicionais */}
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">Deseja Adicionais?</h4>
              <div className="space-y-1.5">
                {activeModalProduct.optionGroups[1].options.map((add) => (
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

            {/* Opção 3: Remover Ingredientes */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">Retirar Ingredientes</h4>
              <div className="grid grid-cols-2 gap-2">
                {activeModalProduct.optionGroups[2].options.map((ing) => (
                  <label key={ing} className="flex items-center space-x-2 bg-gray-800 p-2.5 rounded-lg text-xs cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={removedIngredients.includes(ing)}
                      onChange={() => toggleRemoved(ing)}
                    />
                    <span>{ing}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={confirmCustomProduct}
              style={{ backgroundColor: clientConfig.primaryColor }}
              className="w-full py-3 text-white font-bold rounded-xl text-sm">
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      )}

      {/* ÁREA DO CARRINHO E CHECKOUT */}
      {cart.length > 0 && (
        <div id="checkout-section" className="m-4 mt-8 bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-xl">
          <h3 className="font-bold text-md mb-3 border-b border-gray-800 pb-2 flex justify-between">
            <span>🛒 Seu Carrinho</span>
            <span className="text-xs text-gray-400">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</span>
          </h3>
          
          <div className="space-y-3 mb-4">
            {cart.map((cItem) => (
              <div key={cItem.cartId} className="flex justify-between items-start text-xs text-gray-300 bg-gray-800 p-2.5 rounded-lg">
                <div className="pr-2">
                  <div className="font-bold text-white">{cItem.name}</div>
                  {cItem.details && <div className="text-[11px] text-gray-400 mt-0.5">{cItem.details}</div>}
                  <div className="text-orange-400 font-bold mt-1">R$ {cItem.finalPrice.toFixed(2)}</div>
                </div>
                <button 
                  onClick={() => removeFromCart(cItem.cartId)} 
                  className="text-red-400 font-bold text-sm p-1 bg-gray-700/50 hover:bg-red-500/20 rounded">
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Seleção de Bairro / Taxa de Entrega */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 block mb-1">Selecione seu Bairro (Taxa de Entrega):</label>
            <select 
              className="w-full bg-gray-800 text-white p-2.5 rounded-lg text-sm border border-gray-700 focus:outline-none"
              onChange={(e) => setSelectedNeighborhood(neighborhoods[e.target.value])}>
              {neighborhoods.map((n, idx) => (
                <option key={n.name} value={idx}>
                  {n.name} {n.fee > 0 ? `(+ R$ ${n.fee.toFixed(2)})` : ''}
                </option>
              ))}
            </select>
          </div>

          <input 
            type="text" 
            placeholder="Seu Nome Completo" 
            className="w-full bg-gray-800 text-white p-2.5 rounded-lg text-sm mb-2 border border-gray-700 focus:outline-none"
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Endereço (Rua, Nº, Complemento)" 
            className="w-full bg-gray-800 text-white p-2.5 rounded-lg text-sm mb-2 border border-gray-700 focus:outline-none"
            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
          />
          
          <select 
            className="w-full bg-gray-800 text-white p-2.5 rounded-lg text-sm mb-3 border border-gray-700 focus:outline-none"
            onChange={(e) => setCustomer({ ...customer, payment: e.target.value })}>
            <option value="PIX">Pagamento via PIX</option>
            <option value="Cartão de Crédito/Débito">Cartão na Entrega</option>
            <option value="Dinheiro">Dinheiro (Avisar se precisa de troco)</option>
          </select>

          <div className="bg-gray-800 p-3 rounded-lg mb-4 space-y-1 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal:</span>
              <span>R$ {calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Taxa de Entrega ({selectedNeighborhood.name}):</span>
              <span>R$ {selectedNeighborhood.fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-gray-700">
              <span>Total Final:</span>
              <span style={{ color: clientConfig.primaryColor }}>R$ {calculateTotal()}</span>
            </div>
          </div>

          <button 
            onClick={sendOrderToWhatsApp}
            className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center space-x-2">
            <span>Enviar Pedido pelo WhatsApp</span>
            <span>🚀</span>
          </button>
        </div>
      )}

      {/* BARRA FLUTUANTE DO CARRINHO (RODAPÉ FIXO) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 max-w-md mx-auto">
          <button 
            onClick={scrollToCheckout}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold p-3.5 rounded-xl shadow-2xl flex justify-between items-center transition border border-green-500/30">
            <div className="flex items-center space-x-2">
              <span className="bg-black/30 text-xs px-2.5 py-1 rounded-full">{cart.length}</span>
              <span className="text-xs uppercase tracking-wider">Ver Carrinho</span>
            </div>
            <div className="text-sm font-bold">
              R$ {calculateTotal()} ➔
            </div>
          </button>
        </div>
      )}

    </div>
  );
}
