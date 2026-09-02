import React, { useState } from 'react';

const clientConfig = {
  name: "Borba Cordeiros",
  whatsapp: "5547999999999", // Altere para o WhatsApp real da loja
  primaryColor: "#FF8C00",
  backgroundColor: "#121212",
  textColor: "#FFFFFF"
};

const products = [
  {
    id: 1,
    name: "X-Salada Especial Borba",
    description: "Pão brioche, hambúrguer artesanal 160g, queijo cheddar, alface, tomate e maionese da casa.",
    price: 24.90
  },
  {
    id: 2,
    name: "Porção de Batata com Cheddar e Bacon",
    description: "500g de batata frita crocante coberta com molho cheddar e bacon em cubos.",
    price: 38.00
  }
];

export default function Home() {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', address: '', payment: 'PIX', notes: '' });

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
    <div style={{ backgroundColor: clientConfig.backgroundColor, color: clientConfig.textColor }} className="min-h-screen p-4 max-w-md mx-auto font-sans">
      <header className="text-center py-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold" style={{ color: clientConfig.primaryColor }}>
          {clientConfig.name}
        </h1>
        <p className="text-xs text-gray-400 mt-1">Lanches & Petiscos • Entrega Rápida</p>
      </header>

      <div className="mt-6 space-y-4">
        <h2 className="text-lg font-semibold border-l-4 pl-2" style={{ borderColor: clientConfig.primaryColor }}>
          Cardápio
        </h2>
        
        {products.map((item) => (
          <div key={item.id} className="bg-gray-900 p-3 rounded-lg flex justify-between items-center border border-gray-800">
            <div className="pr-2">
              <h3 className="font-bold text-sm">{item.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{item.description}</p>
              <p className="text-sm font-bold mt-2" style={{ color: clientConfig.primaryColor }}>
                R$ {item.price.toFixed(2)}
              </p>
            </div>
            <button 
              onClick={() => addToCart(item)}
              style={{ backgroundColor: clientConfig.primaryColor }}
              className="text-white text-xs px-3 py-2 rounded-md font-bold whitespace-nowrap">
              + Add
            </button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="mt-8 bg-gray-900 p-4 rounded-xl border border-gray-700">
          <h3 className="font-bold text-md mb-3">Finalizar Pedido ({cart.length} itens)</h3>
          
          <input 
            type="text" 
            placeholder="Seu Nome" 
            className="w-full bg-gray-800 text-white p-2 rounded text-sm mb-2 border border-gray-700"
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Endereço de Entrega (Rua, Nº, Bairro)" 
            className="w-full bg-gray-800 text-white p-2 rounded text-sm mb-2 border border-gray-700"
            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
          />
          
          <select 
            className="w-full bg-gray-800 text-white p-2 rounded text-sm mb-3 border border-gray-700"
            onChange={(e) => setCustomer({ ...customer, payment: e.target.value })}>
            <option value="PIX">Pagamento via PIX</option>
            <option value="Cartão de Crédito/Débito">Cartão na Entrega</option>
            <option value="Dinheiro">Dinheiro</option>
          </select>

          <div className="flex justify-between font-bold text-lg mb-4">
            <span>Total:</span>
            <span style={{ color: clientConfig.primaryColor }}>R$ {calculateTotal()}</span>
          </div>

          <button 
            onClick={sendOrderToWhatsApp}
            className="w-full py-3 bg-green-600 text-white font-bold rounded-lg text-sm">
            Enviar Pedido pelo WhatsApp 🚀
          </button>
        </div>
      )}
    </div>
  );
}
