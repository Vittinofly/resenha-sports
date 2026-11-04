'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CATEGORIAS_CARDAPIO } from '@/lib/config';

// Ordena categorias seguindo CATEGORIAS_CARDAPIO; desconhecidas vão para o fim em ordem alfabética.
export function ordemCategoria(a, b) {
  const ia = CATEGORIAS_CARDAPIO.indexOf(a);
  const ib = CATEGORIAS_CARDAPIO.indexOf(b);
  if (ia === -1 && ib === -1) return a.localeCompare(b);
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
}

export function agruparPorCategoria(itens) {
  const grupos = new Map();
  for (const item of itens) {
    const cat = item.categoria || 'Outros';
    if (!grupos.has(cat)) grupos.set(cat, []);
    grupos.get(cat).push(item);
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => ordemCategoria(a, b))
    .map(([categoria, lista]) => [categoria, lista.sort((x, y) => x.nome.localeCompare(y.nome))]);
}

export function normalizarBusca(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Itens disponíveis do cardápio (lado do cliente)
export function useCardapioDisponivel() {
  const [estado, setEstado] = useState({ itens: [], carregando: true, erro: false });

  useEffect(() => {
    let ativo = true;
    supabase
      .from('cardapio')
      .select('*')
      .eq('disponivel', true)
      .then(({ data, error }) => {
        if (ativo) setEstado({ itens: data || [], carregando: false, erro: !!error });
      });
    return () => {
      ativo = false;
    };
  }, []);

  return estado;
}
