import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form Novo Produto
  const [newProd, setNewProd] = useState({ name: '', price: '', category_id: '', description: '', image: '' });

  // Autenticação simples vinculada ao banco
  const handleLogin = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('tenants').select('admin_password').eq('id', 1).single();
    if (data && password === data.admin_password) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert('Senha incorreta!');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: pData } = await supabase.from('products').select('*').eq('tenant_id', 1).order('id', { ascending: true });
    const { data: cData } = await supabase.from('categories').select('*').eq('tenant_id', 1);
    const { data: nData } = await supabase.from('neighborhoods').select('*').eq('tenant_id', 1);

    if (pData) setProducts(pData);
    if (cData) {
      setCategories(cData);
      if (cData.length > 0) setNewProd(prev => ({ ...prev, category_id: cData[0].id }));
    }
    if (nData) setNeighborhoods(nData);
    setLoading(false);
  };

  const toggleProductActive = async (id, currentStatus) => {
    await supabase.from('products').update({ active: !currentStatus }).eq('id', id);
    fetchData();
  };

  const updatePrice = async (id, newPrice) => {
    await supabase.from('products').update({ price: parseFloat(newPrice) || 0 }).eq('id', id);
    fetchData();
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price) return alert("Preencha nome e preço!");

    await supabase.from('products').insert([
      {
        tenant_id: 1,
        category_id: newProd.category_id || categories[0]?.id,
        name: newProd.name,
        description: newProd.description,
        price: parseFloat(newProd.price),
        image: newProd.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80',
        active: true
      }
    ]);

    setNewProd({ name: '', price: '', category_id: categories[0]?.id || '', description: '', image: '' });
    fetchData();
    alert("Produto cadastrado no banco com sucesso!");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4 font-sans">
        <form onSubmit={handleLogin} className="bg-gray-900 p-6 rounded-2xl border border-gray-800 w-full max-w-sm">
          <h2 className="text-xl font-bold text-orange-500 mb-1 text-center">Painel de Gestão</h2>
          <p className="text-xs text-gray-400 text-center mb-6">Borba Cordeiros</p>
          <input 
            type="password" 
            placeholder="Senha de acesso..."
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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 max-w-md mx-auto font-sans pb-12">
      <header className="flex justify-between items-center py-4 border-b border-gray-800 mb-6">
        <div>
          <h1 className="font-bold text-lg text-orange-500">Gestão de Cardápio</h1>
          <p className="text-xs text-gray-400">Banco de Dados em Tempo Real</p>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-xs bg-gray-800 px-3 py-1.5 rounded-lg text-red-400 font-bold">
          Sair
        </button>
      </header>

      {/* NOVO ITEM */}
      <section className="bg-gray-900 p-4 rounded-xl border border-gray-800 mb-6">
        <h3 className="font-bold text-sm mb-3 text-orange-400">➕ Cadastrar Item no Banco</h3>
        <form onSubmit={handleAddProduct} className="space-y-3">
          <input 
            type="text" 
            placeholder="Nome (Ex: X-Bacon Supremo)"
            value={newProd.name}
            className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
            onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Descrição curta"
            value={newProd.description}
            className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
            onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
          />
          <div className="flex space-x-2">
            <input 
              type="number" 
              step="0.01"
              placeholder="Preço (Ex: 29.90)"
              value={newProd.price}
              className="w-1/2 bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
              onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
            />
            <select 
              value={newProd.category_id}
              className="w-1/2 bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
              onChange={(e) => setNewProd({ ...newProd, category_id: e.target.value })}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-bold py-2.5 rounded-lg text-xs">
            Salvar no Banco
          </button>
        </form>
      </section>

      {/* ITENS CADASTRADOS */}
      <section className="space-y-3">
        <h3 className="font-bold text-sm text-gray-300">📋 Produtos Ativos ({products.length})</h3>
        {loading ? <p className="text-xs text-gray-500">Carregando dados...</p> : products.map((item) => (
          <div key={item.id} className="bg-gray-900 p-3 rounded-xl border border-gray-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className={`font-bold text-sm ${!item.active ? 'line-through text-gray-500' : ''}`}>
                {item.name}
              </span>
              <button 
                onClick={() => toggleProductActive(item.id, item.active)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${item.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {item.active ? 'Disponível' : 'Pausado'}
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
