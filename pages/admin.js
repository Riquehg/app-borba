import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newProd, setNewProd] = useState({
    name: '',
    price: '',
    category_id: '',
    description: '',
    image: '',
    addons: 'Bacon Extra:4.50, Cheddar Extra:3.50, Burguer Extra:8.00',
    removals: 'Sem Cebola, Sem Tomate, Sem Maionese'
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (password === 'borba123') {
      setIsAuthenticated(true);
      fetchData();
      return;
    }
    try {
      const { data } = await supabase.from('tenants').select('admin_password').eq('id', 1).single();
      if (data && password === data.admin_password) {
        setIsAuthenticated(true);
        fetchData();
      } else {
        alert('Senha incorreta!');
      }
    } catch (err) {
      alert('Erro de conexão com o banco.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: cData } = await supabase.from('categories').select('*').eq('tenant_id', 1).order('id', { ascending: true });
    const { data: pData } = await supabase.from('products').select('*').eq('tenant_id', 1).order('id', { ascending: true });

    if (cData) {
      setCategories(cData);
      if (cData.length > 0 && !newProd.category_id) {
        setNewProd(prev => ({ ...prev, category_id: cData[0].id }));
      }
    }
    if (pData) setProducts(pData);
    setLoading(false);
  };

  const toggleProductActive = async (id, currentStatus) => {
    await supabase.from('products').update({ active: !currentStatus }).eq('id', id);
    fetchData();
  };

  const deleteProduct = async (id) => {
    if (confirm("Tem certeza que deseja excluir permanentemente este item?")) {
      await supabase.from('products').delete().eq('id', id);
      fetchData();
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price) return alert("Preencha o nome e o preço do produto!");

    const selectedCategory = newProd.category_id || (categories[0] ? categories[0].id : 1);
    const fallbackImg = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80';

    const { error } = await supabase.from('products').insert([
      {
        tenant_id: 1,
        category_id: parseInt(selectedCategory),
        name: newProd.name,
        description: newProd.description,
        price: parseFloat(newProd.price),
        image: newProd.image || fallbackImg,
        active: true,
        has_options: true,
        addons_list: newProd.addons,
        removals_list: newProd.removals
      }
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao cadastrar produto: " + error.message);
    } else {
      setNewProd({
        name: '',
        price: '',
        category_id: categories[0]?.id || '',
        description: '',
        image: '',
        addons: 'Bacon Extra:4.50, Cheddar Extra:3.50',
        removals: 'Sem Cebola, Sem Tomate'
      });
      fetchData();
      alert("Produto adicionado com sucesso!");
    }
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
          <p className="text-xs text-gray-400">Banco em Tempo Real</p>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-xs bg-gray-800 px-3 py-1.5 rounded-lg text-red-400 font-bold">
          Sair
        </button>
      </header>

      {/* CADASTRO */}
      <section className="bg-gray-900 p-4 rounded-xl border border-gray-800 mb-6">
        <h3 className="font-bold text-sm mb-3 text-orange-400">➕ Cadastrar Lanche / Item</h3>
        <form onSubmit={handleAddProduct} className="space-y-3">
          <input 
            type="text" 
            placeholder="Nome do Produto (Ex: X-Bacon)"
            value={newProd.name}
            className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
            onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Descrição curta (Ex: Pão brioche, carne 160g...)"
            value={newProd.description}
            className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
            onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
          />
          
          <div className="flex space-x-2">
            <input 
              type="number" 
              step="0.01"
              placeholder="Preço (R$)"
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

          <input 
            type="text" 
            placeholder="Link da Foto (ImgBB / Instagram ou Deixe em branco)"
            value={newProd.image}
            className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
            onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
          />

          <div className="border-t border-gray-800 pt-2">
            <label className="text-[11px] text-gray-400 block mb-1">Adicionais (Nome:Preço):</label>
            <input 
              type="text" 
              value={newProd.addons}
              className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-xs text-white focus:outline-none"
              onChange={(e) => setNewProd({ ...newProd, addons: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Remoções (Separadas por vírgula):</label>
            <input 
              type="text" 
              value={newProd.removals}
              className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-xs text-white focus:outline-none"
              onChange={(e) => setNewProd({ ...newProd, removals: e.target.value })}
            />
          </div>

          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-bold py-2.5 rounded-lg text-xs mt-2">
            Salvar Lanche no Banco 🚀
          </button>
        </form>
      </section>

      {/* LISTA */}
      <section className="space-y-3">
        <h3 className="font-bold text-sm text-gray-300">📋 Produtos no Cardápio ({products.length})</h3>
        {loading ? <p className="text-xs text-gray-500">Carregando...</p> : products.map((item) => (
          <div key={item.id} className="bg-gray-900 p-3 rounded-xl border border-gray-800 flex justify-between items-center space-x-2">
            <div>
              <span className={`font-bold text-sm block ${!item.active ? 'line-through text-gray-500' : 'text-white'}`}>
                {item.name}
              </span>
              <span className="text-xs text-orange-400 font-bold">R$ {Number(item.price).toFixed(2)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => toggleProductActive(item.id, item.active)}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg ${item.active ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {item.active ? 'Ativo' : 'Pausado'}
              </button>
              
              <button 
                onClick={() => deleteProduct(item.id)}
                className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40 p-1.5 rounded-lg font-bold">
                🗑
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
