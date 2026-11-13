'use client';

import { supabase } from '@/lib/supabase';
import { useFeedback } from '@/components/feedback';
import { useEmpresa } from '@/components/empresa-contexto';
import { useAdmin } from '@/components/admin/shell';
import { CabecalhoPagina, Vazio } from '@/components/admin/ui';
import FormularioEmpresa from '@/components/admin/formulario-empresa';
import { Lock } from 'lucide-react';

export default function ConfiguracoesPage() {
  const empresa = useEmpresa();
  const { usuario } = useAdmin();
  const { toast } = useFeedback();

  if (usuario?.papel !== 'admin') {
    return <Vazio icone={Lock} titulo="Acesso restrito">Só administradores alteram as configurações da empresa.</Vazio>;
  }

  const salvar = async ({ linha }) => {
    const { error } = await supabase.from('empresas').update(linha).eq('id', empresa.id);
    if (error) return toast('Erro ao salvar: ' + error.message, 'erro');
    toast('Configurações salvas. O site é atualizado em até 1 minuto.');
  };

  return (
    <>
      <CabecalhoPagina titulo="Configurações" descricao="Marca, contato, horários e regras de reserva da sua empresa." />
      <FormularioEmpresa inicial={empresa} aoSalvar={salvar} aoErro={(m) => toast(m, 'erro')} />
    </>
  );
}
