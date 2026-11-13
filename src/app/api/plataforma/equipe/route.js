import { createClient } from '@supabase/supabase-js';
import { ambienteEmpresa } from '@/lib/empresa-servidor';
import { normalizarEmpresa } from '@/lib/empresa';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const responder = (status, erro) => Response.json({ erro }, { status });

// Convida uma pessoa para a equipe de uma empresa. Roda no servidor porque
// criar usuário exige a chave de serviço, que nunca pode chegar ao navegador.
// Só super-usuários, identificados pelo token de login enviado no cabeçalho.
export async function POST(request) {
  const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chaveServico) return responder(503, 'Convites desativados: configure SUPABASE_SERVICE_ROLE_KEY no servidor.');

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, chaveServico, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: sessao } = token ? await admin.auth.getUser(token) : { data: null };
  if (!sessao?.user) return responder(401, 'Sessão inválida. Entre novamente.');

  const { data: ehSuper } = await admin.from('super_usuarios').select('user_id').eq('user_id', sessao.user.id).maybeSingle();
  if (!ehSuper) return responder(403, 'Apenas o super-usuário pode convidar.');

  const corpo = await request.json().catch(() => null);
  const email = String(corpo?.email || '').trim().toLowerCase();
  const papel = corpo?.papel;
  if (!UUID.test(corpo?.empresaId || '')) return responder(400, 'Empresa inválida.');
  if (!EMAIL.test(email)) return responder(400, 'E-mail inválido.');
  if (!['admin', 'atendente'].includes(papel)) return responder(400, 'Papel inválido.');

  const { data: linha } = await admin.from('empresas').select('id, slug, dominio, nome, ativo, config').eq('id', corpo.empresaId).maybeSingle();
  if (!linha) return responder(404, 'Empresa não encontrada.');
  const { siteUrl } = normalizarEmpresa(linha, ambienteEmpresa());

  // Quem já tem conta (por exemplo, em outra empresa) só é vinculado
  let convidado = true;
  let usuarioId;
  const { data: convite, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${siteUrl}/login/nova-senha` });
  if (error) {
    if (error.code !== 'email_exists' && error.status !== 422) return responder(502, `Não foi possível enviar o convite: ${error.message}`);
    const { data: existente } = await admin.rpc('id_usuario_por_email', { p_email: email });
    if (!existente) return responder(502, 'Não foi possível localizar o usuário.');
    usuarioId = existente;
    convidado = false;
  } else {
    usuarioId = convite.user.id;
  }

  const { error: erroEquipe } = await admin.from('equipe').upsert({ empresa_id: linha.id, user_id: usuarioId, papel, email }, { onConflict: 'empresa_id,user_id' });
  if (erroEquipe) return responder(500, `Convite enviado, mas não foi possível vincular à equipe: ${erroEquipe.message}`);

  return Response.json({ ok: true, convidado });
}
