import { empresaDaRota } from '@/lib/empresa-servidor';
import { respostaIcone } from '@/lib/icone-marca';

export async function GET(_request, { params }) {
  return respostaIcone(await empresaDaRota(params), 512);
}
