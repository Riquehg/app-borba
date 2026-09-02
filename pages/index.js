import React, { useState } from 'react';

// Configurações e Identidade Visual do Cliente (Borba Cordeiros)
const clientConfig = {
  name: "Borba Cordeiros",
  logo: "https://scontent.fnvt1-1.fna.fbcdn.net/v/t39.30808-6/708304749_27798913923043979_7133591830455552075_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x2048&ctp=s2048x2048&_nc_cat=109&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFGyJgcvZZ1omha0ysPAfgCJktJfqUAHgUmS0l-pQAeBbhZe5tqsBo4I0i9RLGSKgeIkzEHnteUjIF7_VbOSYyg&_nc_ohc=I4NUKhgcquwQ7kNvwEprmIf&_nc_oc=AdoNNFmTtLfRghCaOHDIh3biygsZCILS5ZrYXy8UvQfACfKZwf23S5TIxpnmFV37JMsAFJrwqgKOuLwUc2WJrxYd&_nc_zt=23&_nc_ht=scontent.fnvt1-1.fna&_nc_gid=pZX2lDHTiRWKaBvTjHfVSQ&_nc_ss=7b2a8&oh=00_AQKjPW2gf1zkUEHGnxaTPR2CvjMDNMz7hiPX-mBq2J4CiA&oe=6A9E2ED7", // Substituir pelo logo real
  banner: "https://storage.googleapis.com/prod-cardapio-web/uploads/company/image/34208/54f8b26fWhatsApp_Image_2026-06-05_at_10.27.33.jpeg", // Substituir pelo banner real
  whatsapp: "5547999999999", // Insira o WhatsApp da loja
  primaryColor: "#FF8C00",
  backgroundColor: "#121212",
  textColor: "#FFFFFF",
  categories: ["Todos", "Hambúrgueres", "Porções", "Bebidas"]
};

// Produtos com fotos reais e opcionais
const products = [
  {
    id: 1,
    name: "X-Salada Especial Borba",
    category: "Hambúrgueres",
    description: "Pão brioche, hambúrguer artesanal 160g, queijo cheddar, alface, tomate e maionese da casa.",
    price: 24.90,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    name: "Porção de Batata com Cheddar e Bacon",
    category: "Porções",
    description: "500g de batata frita crocante coberta com molho cheddar e bacon em cubos.",
    price: 38.00,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    name: "Coca-Cola Zero 350ml",
    category: "Bebidas",
    description: "Lata 350ml trincando de gelada.",
    price: 6.50,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80"
  }
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', address: '', payment: 'PIX', notes: '' });

  const filteredProducts = selectedCategory === "Todos" 
    ? products 
    : products.filter(item => item.category === selectedCategory);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price, 0).toFixed(2);
  };

  const sendOrderToWhatsApp = () => {
    if (cart.length === 0) return alert("Seu carrinho está vazio!");
    if (!customer.name || !customer.address) return alert("Preencha seu nome e endereço!");

    let itemsSummary = cart.map(item => `• 1x ${item.name} (R$ ${item.price.toFixed(2)})`).join('\n');
    
    const message = 
`*NOVO PEDIDO - ${clientConfig.name.toUpperCase()}* 🍔
----------------------------------
*Cliente:* ${customer.name}
*Endereço:* ${customer.address}
*Pagamento:* ${customer.payment}

*ITENS DO PEDIDO:*
${itemsSummary}

*TOTAL:* R$ ${calculateTotal()}
----------------------------------
*Obs:* ${customer.notes || 'Nenhuma'}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${clientConfig.whatsapp}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div style={{ backgroundColor: clientConfig.backgroundColor, color: clientConfig.textColor }} className="min-h-screen max-w-md mx-auto font-sans pb-10">
      
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

      {/* Lista de Produtos com Fotos */}
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
                  onClick={() => addToCart(item)}
                  style={{ backgroundColor: clientConfig.primaryColor }}
                  className="text-white text-xs px-3 py-1.5 rounded-lg font-bold">
                  + Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo do Carrinho & Checkout */}
      {cart.length > 0 && (
        <div className="m-4 bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-xl">
          <h3 className="font-bold text-md mb-3 border-b border-gray-800 pb-2">
            🛒 Resumo do Pedido ({cart.length} {cart.length === 1 ? 'item' : 'itens'})
          </h3>
          
          <div className="space-y-1 mb-4">
            {cart.map((cItem, index) => (
              <div key={index} className="flex justify-between text-xs text-gray-300">
                <span>1x {cItem.name}</span>
                <span>R$ {cItem.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <input 
            type="text" 
            placeholder="Seu Nome" 
            className="w-full bg-gray-800 text-white p-2 rounded text-sm mb-2 border border-gray-700 focus:outline-none"
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Endereço de Entrega (Rua, Nº, Bairro)" 
            className="w-full bg-gray-800 text-white p-2 rounded text-sm mb-2 border border-gray-700 focus:outline-none"
            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
          />
          
          <select 
            className="w-full bg-gray-800 text-white p-2 rounded text-sm mb-3 border border-gray-700 focus:outline-none"
            onChange={(e) => setCustomer({ ...customer, payment: e.target.value })}>
            <option value="PIX">Pagamento via PIX</option>
            <option value="Cartão de Crédito/Débito">Cartão na Entrega</option>
            <option value="Dinheiro">Dinheiro</option>
          </select>

          <div className="flex justify-between font-bold text-lg mb-4 pt-2 border-t border-gray-800">
            <span>Total:</span>
            <span style={{ color: clientConfig.primaryColor }}>R$ {calculateTotal()}</span>
          </div>

          <button 
            onClick={sendOrderToWhatsApp}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition flex items-center justify-center space-x-2">
            <span>Enviar Pedido pelo WhatsApp</span>
            <span>🚀</span>
          </button>
        </div>
      )}
    </div>
  );
}
