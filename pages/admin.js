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
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(false);

  // Forms
  const [newProd, setNewProd] = useState({ name: '', price: '', category_id: '', description: '', image: '', addons_list: '' });
  const [editingProduct, setEditingProduct] = useState(null);
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
    setLoading(true);
    const { data: tData } = await supabase.from('tenants').select('*').eq('id', 1).single();
    const { data: cData } = await supabase.from('categories').select('*').eq('tenant_id', 1).order('id', { ascending: true });
    const { data: pData } = await supabase.from('products').select('*').eq('tenant_id', 1).order('id', { ascending: true });
    const { data: aData } = await supabase.from('global_addons').select('*').eq('tenant_id', 1).order('id', { ascending: true });
    const { data: nData } = await supabase.from('neighborhoods').select('*').eq('tenant_id', 1).order('id', { ascending: true });

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
    setLoading(false);
  };

  // CADASTRAR PRODUTO
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

  // ATUALIZAR PRODUTO (SALVAR EDIÇÃO)
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
      alert("Erro ao atualizar produto: " + error.message);
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
    if (!newAddon.name || newAddon.price === '') return alert("Preencha nome e preço do adicional!");

    const formattedPrice = parseFloat(String(newAddon.price).replace(',', '.'));
    if (isNaN(formattedPrice)) return alert("Preço do adicional inválido!");

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

      {/* ABAS */}
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
      </div>

      {/* PRODUTOS */}
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

          {/* LISTA */}
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

      {/* MODAL DE EDIÇÃO COM SELEÇÃO DE ADICIONAIS */}
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

              {/* SELEÇÃO DE ADICIONAIS DENTRO DA EDIÇÃO */}
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

      {/* CATEGORIAS */}
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

      {/* ADICIONAIS GLOBAIS */}
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
                <button onClick={() => deleteGlobalAddon(a.id)} className="text-red-400 font-bold p-1">🗑</button>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* BAIRROS */}
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
    </div>
  );
}
