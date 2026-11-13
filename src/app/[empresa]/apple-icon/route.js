import { empresaDaRota } from '@/lib/empresa-servidor';
import { respostaIcone } from '@/lib/icone-marca';

// O iOS aplica o próprio arredondamento: o ícone vai com cantos retos.
export async function GET(_request, { params }) {
  return respostaIcone(await empresaDaRota(params), 180, { arredondado: false });
}
