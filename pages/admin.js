import React, { useState } from 'react';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Lista de produtos gerenciáveis (Simulação)
  const [productList, setProductList] = useState([
    { id: 1, name: "X-Salada Especial Borba", price: 24.90, active: true },
    { id: 2, name: "Porção de Batata com Cheddar e Bacon", price: 38.00, active: true },
    { id: 3, name: "Coca-Cola Zero 350ml", price: 6.50, active: true }
  ]);

  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Hambúrgueres' });

  // Senha de Acesso Temporária do Dono
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'borba123') { // Defina a senha do cliente aqui
      setIsAuthenticated(true);
    } else {
      alert('Senha incorreta!');
    }
  };

  const toggleProductStatus = (id) => {
    setProductList(productList.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const updatePrice = (id, newPrice) => {
    setProductList(productList.map(p => p.id === id ? { ...p, price: parseFloat(newPrice) || 0 } : p));
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return alert("Preencha o nome e o preço!");
    
    setProductList([
      ...productList,
      {
        id: Date.now(),
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        active: true
      }
    ]);
    setNewProduct({ name: '', price: '', category: 'Hambúrgueres' });
    alert("Produto cadastrado com sucesso!");
  };

  // TELA DE LOGIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4 font-sans">
        <form onSubmit={handleLogin} className="bg-gray-900 p-6 rounded-2xl border border-gray-800 w-full max-w-sm">
          <h2 className="text-xl font-bold text-orange-500 mb-1 text-center">Painel de Gestão</h2>
          <p className="text-xs text-gray-400 text-center mb-6">Borba Cordeiros</p>
          
          <label className="text-xs text-gray-400 block mb-1">Senha de Acesso:</label>
          <input 
            type="password" 
            placeholder="Digite a senha..."
            className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl text-sm mb-4 text-white focus:outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl text-sm">
            Entrar no Painel
          </button>
        </form>
      </div>
    );
  }

  // TELA DO PAINEL DE CONTROLE (LOGADO)
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 max-w-md mx-auto font-sans pb-12">
      <header className="flex justify-between items-center py-4 border-b border-gray-800 mb-6">
        <div>
          <h1 className="font-bold text-lg text-orange-500">Gestão do Cardápio</h1>
          <p className="text-xs text-gray-400">Borba Cordeiros</p>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-xs bg-gray-800 px-3 py-1.5 rounded-lg text-red-400 font-bold">
          Sair
        </button>
      </header>

      {/* CADASTRAR NOVO PRODUTO */}
      <section className="bg-gray-900 p-4 rounded-xl border border-gray-800 mb-6">
        <h3 className="font-bold text-sm mb-3 text-orange-400">➕ Cadastrar Novo Item</h3>
        <form onSubmit={handleAddProduct} className="space-y-3">
          <input 
            type="text" 
            placeholder="Nome do Item (Ex: X-Bacon)"
            value={newProduct.name}
            className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          />
          <input 
            type="number" 
            step="0.01"
            placeholder="Preço (Ex: 29.90)"
            value={newProduct.price}
            className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
          />
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-bold py-2.5 rounded-lg text-xs">
            Salvar Item
          </button>
        </form>
      </section>

      {/* GERENCIAR PRODUTOS EXISTENTES */}
      <section className="space-y-3">
        <h3 className="font-bold text-sm text-gray-300">📋 Itens no Cardápio ({productList.length})</h3>
        
        {productList.map((item) => (
          <div key={item.id} className="bg-gray-900 p-3 rounded-xl border border-gray-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className={`font-bold text-sm ${!item.active ? 'line-through text-gray-500' : ''}`}>
                {item.name}
              </span>
              <button 
                onClick={() => toggleProductStatus(item.id)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${item.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {item.active ? 'Ativo no Cardápio' : 'Pausado (Esgotado)'}
              </button>
            </div>

            <div className="flex items-center space-x-2 pt-1 border-t border-gray-800/60">
              <span className="text-xs text-gray-400">Preço R$:</span>
              <input 
                type="number" 
                step="0.01"
                value={item.price}
                onChange={(e) => updatePrice(item.id, e.target.value)}
                className="bg-gray-800 border border-gray-700 text-xs text-orange-400 font-bold p-1 rounded w-24 text-center focus:outline-none"
              />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
