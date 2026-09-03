import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Cozinha() {
  const [orders, setOrders] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    // Atualiza automaticamente a tela a cada 10 segundos
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    const { data: tData } = await supabase.from('tenants').select('*').eq('id', 1).single();
    if (tData) setTenant(tData);

    const { data: oData } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', 1)
      .neq('status', 'concluido')
      .neq('status', 'cancelado')
      .order('created_at', { ascending: true });

    if (oData) setOrders(oData);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    fetchOrders();
  };

  const notifyCustomerWhatsApp = (order, statusText) => {
    let message = "";
    if (statusText === 'producao') {
      message = `Olá *${order.customer_name}*! 👋\nSeu pedido *#${order.id}* da Borba Cordeiros foi *CONFIRMADO* e já está em produção na nossa cozinha! 🍔🔥`;
    } else if (statusText === 'saiu_entrega') {
      if (order.order_type === 'delivery') {
        message = `Olá *${order.customer_name}*! 🛵\nBoas notícias! Seu pedido *#${order.id}* acabou de sair para entrega. Fique atento!`;
      } else {
        message = `Olá *${order.customer_name}*! 🛍️\nSeu pedido *#${order.id}* está *PRONTO* para retirada no nosso balcão! Pode vir buscar.`;
      }
    }

    window.open(`https://wa.me/${tenant?.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getTimeAgo = (dateString) => {
    const diff = Math.floor((new Date() - new Date(dateString)) / 60000);
    if (diff < 1) return 'Agora';
    return `há ${diff} min`;
  };

  const receivedOrders = orders.filter(o => o.status === 'recebido');
  const inProductionOrders = orders.filter(o => o.status === 'producao');
  const deliveryOrders = orders.filter(o => o.status === 'saiu_entrega');

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 font-sans">
      <header className="flex justify-between items-center border-b border-gray-800 pb-3 mb-6">
        <div>
          <h1 className="font-bold text-xl text-orange-500">👨‍🍳 Painel da Cozinha (KDS)</h1>
          <p className="text-xs text-gray-400">Gerenciamento de Pedidos em Tempo Real</p>
        </div>
        <button onClick={fetchOrders} className="bg-gray-800 text-xs px-3 py-2 rounded-lg text-orange-400 font-bold border border-gray-700">
          🔄 Atualizar ({orders.length})
        </button>
      </header>

      {/* ESTRUTURA DE 3 COLUNAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* COLUNA 1: RECEBIDOS */}
        <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 flex flex-col space-y-3">
          <div className="flex justify-between items-center bg-blue-950/40 p-2.5 rounded-xl border border-blue-800/40">
            <span className="font-bold text-xs text-blue-400 uppercase tracking-wider">📥 1. Recebidos ({receivedOrders.length})</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[75vh]">
            {receivedOrders.map(order => (
              <div key={order.id} className="bg-gray-900 p-3 rounded-xl border border-gray-800 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-orange-400 font-bold text-sm block">#{order.id} - {order.customer_name}</span>
                    <span className="text-[11px] text-gray-400">{order.order_type === 'delivery' ? `🛵 Entrega (${order.neighborhood})` : '🛍️ Retirada'}</span>
                  </div>
                  <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-300 font-bold">{getTimeAgo(order.created_at)}</span>
                </div>

                <div className="border-t border-b border-gray-800 py-2 space-y-1 text-xs">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>• 1x {it.name}</span>
                      {it.details && <span className="text-orange-300 text-[10px] block">{it.details}</span>}
                    </div>
                  ))}
                </div>

                <div className="flex space-x-1.5 pt-1">
                  <button 
                    onClick={() => {
                      updateOrderStatus(order.id, 'producao');
                      notifyCustomerWhatsApp(order, 'producao');
                    }}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg text-xs">
                    🍳 Iniciar Produção
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUNA 2: EM PRODUÇÃO */}
        <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 flex flex-col space-y-3">
          <div className="flex justify-between items-center bg-orange-950/40 p-2.5 rounded-xl border border-orange-800/40">
            <span className="font-bold text-xs text-orange-400 uppercase tracking-wider">🍳 2. Em Produção ({inProductionOrders.length})</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[75vh]">
            {inProductionOrders.map(order => (
              <div key={order.id} className="bg-gray-900 p-3 rounded-xl border border-orange-500/30 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-orange-400 font-bold text-sm block">#{order.id} - {order.customer_name}</span>
                    <span className="text-[11px] text-gray-400">{order.order_type === 'delivery' ? `🛵 ${order.neighborhood}` : '🛍️ Retirada'}</span>
                  </div>
                  <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded font-bold">{getTimeAgo(order.created_at)}</span>
                </div>

                <div className="border-t border-b border-gray-800 py-2 space-y-1 text-xs">
                  {order.items.map((it, idx) => (
                    <div key={idx}>
                      <span className="font-bold">• 1x {it.name}</span>
                      {it.details && <span className="text-orange-300 text-[10px] block pl-3">{it.details}</span>}
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    updateOrderStatus(order.id, 'saiu_entrega');
                    notifyCustomerWhatsApp(order, 'saiu_entrega');
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-xs">
                  {order.order_type === 'delivery' ? '🛵 Saiu p/ Entrega' : '🛍️ Pronto p/ Retirada'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* COLUNA 3: SAIU P/ ENTREGA / PRONTO */}
        <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-800 flex flex-col space-y-3">
          <div className="flex justify-between items-center bg-green-950/40 p-2.5 rounded-xl border border-green-800/40">
            <span className="font-bold text-xs text-green-400 uppercase tracking-wider">🛵 3. A caminho / Pronto ({deliveryOrders.length})</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[75vh]">
            {deliveryOrders.map(order => (
              <div key={order.id} className="bg-gray-900 p-3 rounded-xl border border-gray-800 space-y-2 opacity-80">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-green-400 font-bold text-sm block">#{order.id} - {order.customer_name}</span>
                    <span className="text-[11px] text-gray-400">{order.order_type === 'delivery' ? 'A caminho' : 'Aguardando retirada'}</span>
                  </div>
                </div>

                <button 
                  onClick={() => updateOrderStatus(order.id, 'concluido')}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-1.5 rounded-lg text-xs">
                  ✓ Finalizar e Arquivar
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
