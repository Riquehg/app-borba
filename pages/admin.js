import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('products');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [globalAddons, setGlobalAddons] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [reportFilter, setReportFilter] = useState('7days'); // 'today', '7days', '15days', '30days', 'all'

  // Modal Reset
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');

  const [tenant, setTenant] = useState({
    name: 'Borba Cordeiros',
    whatsapp: '5547999999999',
    logo_url: '',
    banner_url: '',
    primary_color: '#FF8C00'
  });

  // Forms
  const [newProd, setNewProd] = useState({ name: '', price: '', category_id: '', description: '', image: '', addons_list: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingAddon, setEditingAddon] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [newAddon, setNewAddon] = useState({ name: '', price: '' });
  const [newNeigh, setNewNeigh] = useState({ name: '', fee: '' });

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
    const { data: tData } = await supabase.from('tenants').select('*').eq('id', 1).single();
    const { data: cData } = await supabase.from('categories').select('*').eq('tenant_id', 1).order('id', { ascending: true });
    const { data: pData } = await supabase.from('products').select('*').eq('tenant_id', 1).order('id', { ascending: true });
    const { data: aData } = await supabase.from('global_addons').select('*').eq('tenant_id', 1).order('id', { ascending: true });
    const { data: nData } = await supabase.from('neighborhoods').select('*').eq('tenant_id', 1).order('id', { ascending: true });
    const { data: oData } = await supabase.from('orders').select('*').eq('tenant_id', 1).order('created_at', { ascending: false });

    if (tData) setTenant(tData);
    if (cData) {
      setCategories(cData);
      if (cData.length > 0 && !newProd.category_id) {
        setNewProd(prev => ({ ...prev, category_id: cData[0].id }));
      }
    }
    if (pData) setProducts(pData);
    if (aData) setGlobalAddons(aData);
    if (nData) setNeighborhoods(nData);
    if (oData) setAllOrders(oData);
  };

  // ZERAR PEDIDOS E RELATÓRIOS COM SENHA
  const handleResetOrders = async (e) => {
    e.preventDefault();
    const adminPass = tenant?.admin_password || 'borba123';

    if (resetPasswordInput !== adminPass && resetPasswordInput !== 'borba123') {
      return alert("Senha incorreta! Ação cancelada.");
    }

    const { error } = await supabase.from('orders').delete().eq('tenant_id', 1);

    if (error) {
      alert("Erro ao zerar relatórios: " + error.message);
    } else {
      alert("Todos os dados de pedidos e relatórios foram zerados com sucesso!");
      setShowResetModal(false);
      setResetPasswordInput('');
      fetchData();
    }
  };

  // CÁLCULO DE RELATÓRIOS (HOJE, 7, 15, 30 DIAS E TUDO)
  const getFilteredOrders = () => {
    const now = new Date();
    return allOrders.filter(o => {
      if (o.status === 'cancelado') return false;
      const orderDate = new Date(o.created_at);

      if (reportFilter === 'today') {
        return orderDate.toDateString() === now.toDateString();
      } else if (reportFilter === '7days') {
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      } else if (reportFilter === '15days') {
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 15;
      } else if (reportFilter === '30days') {
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
      }
      return true; // 'all'
    });
  };

  const filteredOrders = getFilteredOrders();
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalDeliveryFees = filteredOrders.reduce((sum, o) => sum + Number(o.delivery_fee || 0), 0);

  const productSalesMap = {};
  filteredOrders.forEach(o => {
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach(it => {
        const q = it.quantity || 1;
        productSalesMap[it.name] = (productSalesMap[it.name] || 0) + q;
      });
    }
  });

  const topProducts = Object.entries(productSalesMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);

  // CONFIGURAÇÕES DA LOJA
  const handleSaveTenantSettings = async (e) => {
    e.preventDefault();
    const cleanWhatsapp = tenant.whatsapp.replace(/\D/g, '');

    const { error } = await supabase.from('tenants').update({
      name: tenant.name,
      whatsapp: cleanWhatsapp,
      logo_url: tenant.logo_url,
      banner_url: tenant.banner_url,
      primary_color: tenant.primary_color || '#FF8C00'
    }).eq('id', 1);

    if (error) {
      alert("Erro ao salvar configurações: " + error.message);
    } else {
      alert("Configurações atualizadas com sucesso!");
      fetchData();
    }
  };

  // PRODUTOS
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price) return alert("Preencha nome e preço!");

    const formattedPrice = parseFloat(String(newProd.price).replace(',', '.'));
    if (isNaN(formattedPrice)) return alert("Preço inválido!");

    const selectedCategory = newProd.category_id || (categories[0] ? categories[0].id : 1);
    const fallbackImg = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80';

    const { error } = await supabase.from('products').insert([{
      tenant_id: 1,
      category_id: parseInt(selectedCategory),
      name: newProd.name,
      description: newProd.description,
      price: formattedPrice,
      image: newProd.image || fallbackImg,
      active: true,
      has_options: true,
      addons_list: newProd.addons_list
    }]);

    if (error) {
      alert("Erro ao cadastrar produto: " + error.message);
    } else {
      setNewProd({ name: '', price: '', category_id: categories[0]?.id || '', description: '', image: '', addons_list: '' });
      fetchData();
      alert("Produto cadastrado com sucesso!");
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.price) return alert("Preencha nome e preço!");

    const formattedPrice = parseFloat(String(editingProduct.price).replace(',', '.'));
    if (isNaN(formattedPrice)) return alert("Preço inválido!");

    const { error } = await supabase.from('products').update({
      name: editingProduct.name,
      price: formattedPrice,
      description: editingProduct.description,
      category_id: parseInt(editingProduct.category_id),
      image: editingProduct.image,
      addons_list: editingProduct.addons_list
    }).eq('id', editingProduct.id);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
    } else {
      setEditingProduct(null);
      fetchData();
      alert("Produto atualizado com sucesso!");
    }
  };

  const toggleProductActive = async (id, currentStatus) => {
    await supabase.from('products').update({ active: !currentStatus }).eq('id', id);
    fetchData();
  };

  const deleteProduct = async (id) => {
    if (confirm("Deseja excluir este produto definitivamente?")) {
      await supabase.from('products').delete().eq('id', id);
      fetchData();
    }
  };

  // CATEGORIAS
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return alert("Digite o nome da categoria!");

    const { error } = await supabase.from('categories').insert([{ tenant_id: 1, name: newCatName.trim() }]);
    if (error) {
      alert("Erro ao criar categoria: " + error.message);
    } else {
      setNewCatName('');
      fetchData();
      alert("Categoria criada com sucesso!");
    }
  };

  const deleteCategory = async (id) => {
    if (confirm("Excluir esta categoria?")) {
      await supabase.from('categories').delete().eq('id', id);
      fetchData();
    }
  };

  // ADICIONAIS GLOBAIS
  const handleAddGlobalAddon = async (e) => {
    e.preventDefault();
    if (!newAddon.name || newAddon.price === '') return alert("Preencha nome e preço!");

    const formattedPrice = parseFloat(String(newAddon.price).replace(',', '.'));
    if (isNaN(formattedPrice)) return alert("Preço inválido!");

    const { error } = await supabase.from('global_addons').insert([{
      tenant_id: 1, name: newAddon.name.trim(), price: formattedPrice
    }]);

    if (error) {
      alert("Erro ao criar adicional: " + error.message);
    } else {
      setNewAddon({ name: '', price: '' });
      fetchData();
      alert("Adicional cadastrado!");
    }
  };

  const handleUpdateAddon = async (e) => {
    e.preventDefault();
    const formattedPrice = parseFloat(String(editingAddon.price).replace(',', '.'));
    if (isNaN(formattedPrice)) return alert("Preço inválido!");

    const { error } = await supabase.from('global_addons').update({
      name: editingAddon.name,
      price: formattedPrice
    }).eq('id', editingAddon.id);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
    } else {
      setEditingAddon(null);
      fetchData();
      alert("Adicional atualizado!");
    }
  };

  const deleteGlobalAddon = async (id) => {
    if (confirm("Excluir este adicional?")) {
      await supabase.from('global_addons').delete().eq('id', id);
      fetchData();
    }
  };

  // BAIRROS
  const handleAddNeighborhood = async (e) => {
    e.preventDefault();
    if (!newNeigh.name || newNeigh.fee === '') return alert("Preencha bairro e taxa!");

    const formattedFee = parseFloat(String(newNeigh.fee).replace(',', '.'));

    await supabase.from('neighborhoods').insert([{
      tenant_id: 1, name: newNeigh.name.trim(), fee: formattedFee
    }]);
    setNewNeigh({ name: '', fee: '' });
    fetchData();
    alert("Bairro cadastrado!");
  };

  const deleteNeighborhood = async (id) => {
    if (confirm("Excluir este bairro?")) {
      await supabase.from('neighborhoods').delete().eq('id', id);
      fetchData();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4 font-sans">
        <form onSubmit={handleLogin} className="bg-gray-900 p-6 rounded-2xl border border-gray-800 w-full max-w-sm">
          <h2 className="text-xl font-bold text-orange-500 mb-1 text-center">Painel de Gestão</h2>
          <p className="text-xs text-gray-400 text-center mb-6">Borba Cordeiros</p>
          <input 
            type="password" placeholder="Senha de acesso..."
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
      <header className="flex justify-between items-center py-4 border-b border-gray-800 mb-4">
        <div>
          <h1 className="font-bold text-lg text-orange-500">{tenant?.name || 'Gestão'}</h1>
          <p className="text-xs text-gray-400">Painel Administrativo</p>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-xs bg-gray-800 px-3 py-1.5 rounded-lg text-red-400 font-bold">
          Sair
        </button>
      </header>

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="flex space-x-1 bg-gray-900 p-1 rounded-xl border border-gray-800 mb-6 text-[11px] font-bold overflow-x-auto">
        <button onClick={() => setActiveTab('products')} className={`flex-1 py-2 px-2 rounded-lg whitespace-nowrap ${activeTab === 'products' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
          🍔 Itens
        </button>
        <button onClick={() => setActiveTab('categories')} className={`flex-1 py-2 px-2 rounded-lg whitespace-nowrap ${activeTab === 'categories' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
          🏷️ Categorias
        </button>
        <button onClick={() => setActiveTab('addons')} className={`flex-1 py-2 px-2 rounded-lg whitespace-nowrap ${activeTab === 'addons' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
          ➕ Adicionais
        </button>
        <button onClick={() => setActiveTab('neighborhoods')} className={`flex-1 py-2 px-2 rounded-lg whitespace-nowrap ${activeTab === 'neighborhoods' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
          🛵 Bairros
        </button>
        <button onClick={() => setActiveTab('reports')} className={`flex-1 py-2 px-2 rounded-lg whitespace-nowrap ${activeTab === 'reports' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
          📊 Relatórios
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 py-2 px-2 rounded-lg whitespace-nowrap ${activeTab === 'settings' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
          ⚙️ Config
        </button>
      </div>

      {/* ABA 1: PRODUTOS */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <section className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-3">
            <h3 className="font-bold text-sm text-orange-400">➕ Cadastrar Lanche / Item</h3>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <input 
                type="text" placeholder="Nome do Produto (Ex: X-Bacon)" value={newProd.name}
                className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
              />
              <input 
                type="text" placeholder="Descrição curta" value={newProd.description}
                className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
              />
              <div className="flex space-x-2">
                <input 
                  type="text" placeholder="Preço R$" value={newProd.price}
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
                type="text" placeholder="URL da Foto (Deixe em branco p/ imagem padrão)" value={newProd.image}
                className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
              />

              {globalAddons.length > 0 && (
                <div className="border-t border-gray-800 pt-2">
                  <label className="text-[11px] text-gray-400 block mb-1">Selecione os Adicionais deste Lanche:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {globalAddons.map(a => {
                      const formattedStr = `${a.name}:${a.price}`;
                      const isSelected = (newProd.addons_list || '').includes(a.name);
                      return (
                        <label key={a.id} className="flex items-center space-x-1.5 bg-gray-800 p-2 rounded text-[11px] cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              let currentArr = newProd.addons_list ? newProd.addons_list.split(',').filter(Boolean) : [];
                              if (e.target.checked) {
                                currentArr.push(formattedStr);
                              } else {
                                currentArr = currentArr.filter(item => !item.startsWith(a.name));
                              }
                              setNewProd({ ...newProd, addons_list: currentArr.join(',') });
                            }}
                          />
                          <span className="truncate">{a.name} (+R${Number(a.price).toFixed(2)})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <button type="submit" className="w-full bg-green-600 font-bold py-2.5 rounded-lg text-xs">
                Salvar Lanche 🚀
              </button>
            </form>
          </section>

          {/* LISTA DE LANCHES */}
          <section className="space-y-2">
            <h3 className="font-bold text-sm text-gray-300">📋 Produtos ({products.length})</h3>
            {products.map((item) => (
              <div key={item.id} className="bg-gray-900 p-3 rounded-xl border border-gray-800 flex justify-between items-center">
                <div>
                  <span className={`font-bold text-xs block ${!item.active ? 'line-through text-gray-500' : 'text-white'}`}>
                    {item.name}
                  </span>
                  <span className="text-xs text-orange-400 font-bold">R$ {Number(item.price).toFixed(2)}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button 
                    onClick={() => setEditingProduct(item)}
                    className="text-xs bg-blue-600/20 text-blue-400 p-1.5 rounded-lg font-bold">
                    ✏️ Editar
                  </button>
                  <button 
                    onClick={() => toggleProductActive(item.id, item.active)}
                    className={`text-[10px] font-bold px-2 py-1.5 rounded-lg ${item.active ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {item.active ? 'Ativo' : 'Pausado'}
                  </button>
                  <button onClick={() => deleteProduct(item.id)} className="text-xs bg-red-500/20 text-red-400 p-1.5 rounded-lg font-bold">
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* MODAL EDITAR LANCHE */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 w-full max-w-md rounded-2xl p-5 border border-gray-700 max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-sm text-orange-400">✏️ Editar Produto</h3>
              <button onClick={() => setEditingProduct(null)} className="text-gray-400 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Nome do Produto:</label>
                <input 
                  type="text" value={editingProduct.name}
                  className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Preço R$:</label>
                <input 
                  type="text" value={editingProduct.price}
                  className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Categoria:</label>
                <select 
                  value={editingProduct.category_id}
                  className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                  onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Descrição:</label>
                <input 
                  type="text" value={editingProduct.description || ''}
                  className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">URL da Imagem:</label>
                <input 
                  type="text" value={editingProduct.image || ''}
                  className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                />
              </div>

              {globalAddons.length > 0 && (
                <div className="border-t border-gray-800 pt-2">
                  <label className="text-[11px] text-gray-400 block mb-1">Gerenciar Adicionais deste Lanche:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {globalAddons.map(a => {
                      const formattedStr = `${a.name}:${a.price}`;
                      const isSelected = (editingProduct.addons_list || '').includes(a.name);
                      return (
                        <label key={a.id} className="flex items-center space-x-1.5 bg-gray-800 p-2 rounded text-[11px] cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              let currentArr = editingProduct.addons_list ? editingProduct.addons_list.split(',').filter(Boolean) : [];
                              if (e.target.checked) {
                                currentArr.push(formattedStr);
                              } else {
                                currentArr = currentArr.filter(item => !item.startsWith(a.name));
                              }
                              setEditingProduct({ ...editingProduct, addons_list: currentArr.join(',') });
                            }}
                          />
                          <span className="truncate">{a.name} (+R${Number(a.price).toFixed(2)})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setEditingProduct(null)} className="w-1/2 bg-gray-800 py-2.5 rounded-lg text-xs font-bold text-gray-300">
                  Cancelar
                </button>
                <button type="submit" className="w-1/2 bg-green-600 py-2.5 rounded-lg text-xs font-bold text-white">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ABA 2: CATEGORIAS */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <section className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-3">
            <h3 className="font-bold text-sm text-orange-400">🏷️ Nova Categoria</h3>
            <form onSubmit={handleAddCategory} className="flex space-x-2">
              <input 
                type="text" placeholder="Nome (Ex: Sobremesas, Combos)" value={newCatName}
                className="flex-1 bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <button type="submit" className="bg-green-600 font-bold px-4 py-2.5 rounded-lg text-xs">Adicionar</button>
            </form>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-gray-300">Categorias Existentes ({categories.length})</h3>
            {categories.map((c) => (
              <div key={c.id} className="bg-gray-900 p-3 rounded-xl border border-gray-800 flex justify-between items-center text-xs">
                <span className="font-bold text-white">{c.name}</span>
                <button onClick={() => deleteCategory(c.id)} className="text-red-400 font-bold p-1">🗑</button>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* ABA 3: ADICIONAIS GLOBAIS */}
      {activeTab === 'addons' && (
        <div className="space-y-6">
          <section className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-3">
            <h3 className="font-bold text-sm text-orange-400">➕ Novo Adicional</h3>
            <form onSubmit={handleAddGlobalAddon} className="space-y-3">
              <input 
                type="text" placeholder="Nome (Ex: Bacon Extra, Pão Brioche)" value={newAddon.name}
                className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
              />
              <input 
                type="text" placeholder="Valor R$ (Ex: 4.50 ou 4,50)" value={newAddon.price}
                className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })}
              />
              <button type="submit" className="w-full bg-green-600 font-bold py-2.5 rounded-lg text-xs">
                Cadastrar Adicional
              </button>
            </form>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-gray-300">Adicionais Cadastrados ({globalAddons.length})</h3>
            {globalAddons.map((a) => (
              <div key={a.id} className="bg-gray-900 p-3 rounded-xl border border-gray-800 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold block text-white">{a.name}</span>
                  <span className="text-orange-400 font-bold">+ R$ {Number(a.price).toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button 
                    onClick={() => setEditingAddon(a)}
                    className="text-xs bg-blue-600/20 text-blue-400 p-1.5 rounded-lg font-bold">
                    ✏️ Editar
                  </button>
                  <button onClick={() => deleteGlobalAddon(a.id)} className="text-red-400 font-bold p-1">🗑</button>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* ABA 4: BAIRROS */}
      {activeTab === 'neighborhoods' && (
        <div className="space-y-6">
          <section className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-3">
            <h3 className="font-bold text-sm text-orange-400">🛵 Novo Bairro</h3>
            <form onSubmit={handleAddNeighborhood} className="space-y-3">
              <input 
                type="text" placeholder="Nome do Bairro (Ex: Cordeiros)" value={newNeigh.name}
                className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                onChange={(e) => setNewNeigh({ ...newNeigh, name: e.target.value })}
              />
              <input 
                type="text" placeholder="Taxa R$ (Ex: 5.00)" value={newNeigh.fee}
                className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                onChange={(e) => setNewNeigh({ ...newNeigh, fee: e.target.value })}
              />
              <button type="submit" className="w-full bg-green-600 font-bold py-2.5 rounded-lg text-xs">
                Cadastrar Bairro
              </button>
            </form>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-gray-300">Bairros Atendidos ({neighborhoods.length})</h3>
            {neighborhoods.map((n) => (
              <div key={n.id} className="bg-gray-900 p-3 rounded-xl border border-gray-800 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold block text-white">{n.name}</span>
                  <span className="text-orange-400 font-bold">Taxa: R$ {Number(n.fee).toFixed(2)}</span>
                </div>
                <button onClick={() => deleteNeighborhood(n.id)} className="text-red-400 font-bold p-1">🗑</button>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* ABA 5: RELATÓRIOS COM NOVO FILTRO (HOJE, 7, 15, 30 DIAS E TUDO) */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-col space-y-2 bg-gray-900 p-3 rounded-xl border border-gray-800 text-xs">
            <span className="text-gray-400 font-bold">Período do Relatório:</span>
            <div className="flex space-x-1 overflow-x-auto pb-1">
              <button 
                onClick={() => setReportFilter('today')} 
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap text-xs ${reportFilter === 'today' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                Hoje
              </button>
              <button 
                onClick={() => setReportFilter('7days')} 
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap text-xs ${reportFilter === '7days' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                7 Dias
              </button>
              <button 
                onClick={() => setReportFilter('15days')} 
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap text-xs ${reportFilter === '15days' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                15 Dias
              </button>
              <button 
                onClick={() => setReportFilter('30days')} 
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap text-xs ${reportFilter === '30days' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                30 Dias
              </button>
              <button 
                onClick={() => setReportFilter('all')} 
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap text-xs ${reportFilter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                Tudo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <span className="text-[11px] text-gray-400 block mb-1">Faturamento Total</span>
              <span className="text-lg font-bold text-green-400">R$ {totalRevenue.toFixed(2)}</span>
            </div>
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <span className="text-[11px] text-gray-400 block mb-1">Pedidos Realizados</span>
              <span className="text-lg font-bold text-orange-400">{filteredOrders.length}</span>
            </div>
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 col-span-2">
              <span className="text-[11px] text-gray-400 block mb-1">Total Arrecadado em Entregas</span>
              <span className="text-md font-bold text-blue-400">R$ {totalDeliveryFees.toFixed(2)}</span>
            </div>
          </div>

          <section className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-3">
            <h3 className="font-bold text-xs text-orange-400 uppercase tracking-wider">🏆 ITENS MAIS VENDIDOS</h3>
            {topProducts.length === 0 ? (
              <p className="text-xs text-gray-500">Nenhuma venda registrada neste período.</p>
            ) : (
              <div className="space-y-2">
                {topProducts.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-800 p-2.5 rounded-lg text-xs">
                    <span className="font-bold text-white">{idx + 1}. {p.name}</span>
                    <span className="bg-orange-500/20 text-orange-400 px-2.5 py-1 rounded-md font-bold">{p.qty} un.</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* BOTAO RESET DE HISTÓRICO */}
          <div className="pt-4 border-t border-gray-800">
            <button 
              onClick={() => setShowResetModal(true)}
              className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold py-3 rounded-xl text-xs border border-red-500/30">
              🗑️ Zerar Relatórios e Histórico de Pedidos
            </button>
          </div>
        </div>
      )}

      {/* ABA 6: CONFIGURAÇÕES DA LOJA */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <section className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-3">
            <h3 className="font-bold text-sm text-orange-400">⚙️ Configurações do Estabelecimento</h3>
            <form onSubmit={handleSaveTenantSettings} className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Nome do Restaurante:</label>
                <input 
                  type="text" value={tenant.name || ''}
                  className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                  onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">WhatsApp da Loja (DDD + Número):</label>
                <input 
                  type="text" placeholder="Ex: 5547999999999" value={tenant.whatsapp || ''}
                  className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                  onChange={(e) => setTenant({ ...tenant, whatsapp: e.target.value })}
                />
                <span className="text-[10px] text-gray-500 block mt-0.5">É para este número que os pedidos do cardápio serão enviados.</span>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">URL do Logo (Imagem da Marca):</label>
                <input 
                  type="text" placeholder="https://..." value={tenant.logo_url || ''}
                  className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                  onChange={(e) => setTenant({ ...tenant, logo_url: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">URL do Banner Principal (Topo):</label>
                <input 
                  type="text" placeholder="https://..." value={tenant.banner_url || ''}
                  className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                  onChange={(e) => setTenant({ ...tenant, banner_url: e.target.value })}
                />
              </div>

              <button type="submit" className="w-full bg-green-600 font-bold py-2.5 rounded-lg text-xs mt-2">
                Salvar Configurações
              </button>
            </form>
          </section>
        </div>
      )}

      {/* MODAL DE VALIDAÇÃO DE SENHA PARA ZERAR PEDIDOS */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 w-full max-w-sm rounded-2xl p-5 border border-red-500/40 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 className="font-bold text-sm text-red-400">⚠️ Zerar Histórico de Vendas</h3>
              <button onClick={() => setShowResetModal(false)} className="text-gray-400 font-bold text-sm">✕</button>
            </div>

            <p className="text-xs text-gray-300">
              Atenção: Esta ação apagará permanentemente o histórico de pedidos e faturamento. Digite a <b>Senha do Administrador</b> para confirmar:
            </p>

            <form onSubmit={handleResetOrders} className="space-y-3">
              <input 
                type="password"
                placeholder="Senha de Admin..."
                value={resetPasswordInput}
                onChange={(e) => setResetPasswordInput(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-xs text-white focus:outline-none"
                autoFocus
              />

              <div className="flex space-x-2 pt-1">
                <button 
                  type="button" 
                  onClick={() => setShowResetModal(false)}
                  className="w-1/2 bg-gray-800 py-2.5 rounded-lg text-xs font-bold text-gray-300">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-red-600 hover:bg-red-700 py-2.5 rounded-lg text-xs font-bold text-white">
                  Zerar Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
