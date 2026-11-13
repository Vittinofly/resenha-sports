// Pix "copia e cola" (BR Code, padrão EMV MPM do Banco Central) e regras de sinal.

const campo = (id, valor) => `${id}${String(valor.length).padStart(2, '0')}${valor}`;

// O BR Code aceita apenas ASCII sem acento nos campos de nome/cidade
const ascii = (texto, max) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .slice(0, max)
    .toUpperCase();

// CRC16/CCITT-FALSE (polinômio 0x1021, valor inicial 0xFFFF), exigido no campo 63
export function crc16(texto) {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Gera o código "copia e cola". `txid`: até 25 caracteres alfanuméricos.
export function gerarPixCopiaECola({ chave, titular, cidade, valor, txid = '***', descricao = '' }) {
  if (!chave) return '';
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', chave) + (descricao ? campo('02', descricao.slice(0, 40)) : '');
  const id = txid === '***' ? '***' : String(txid).replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';
  const corpo =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    (valor > 0 ? campo('54', Number(valor).toFixed(2)) : '') +
    campo('58', 'BR') +
    campo('59', ascii(titular, 25) || 'RECEBEDOR') +
    campo('60', ascii(cidade, 15) || 'BRASIL') +
    campo('62', campo('05', id)) +
    '6304';
  return corpo + crc16(corpo);
}

// Valor do sinal para uma reserva, conforme as regras da empresa. `data` = 'YYYY-MM-DD', `inicio`/`fim` = 'HH:MM'.
export function calcularSinal(tipo, { data, inicio, fim } = {}, regras = {}, ativo = false) {
  if (!ativo) return 0;
  if (tipo === 'quiosques') return regras.quiosques || 0;
  if (tipo === 'mesas') return regras.mesas || 0;
  if (tipo !== 'quadras' || !inicio || !fim || !data) return 0;

  const { aPartirDe, fimDeSemanaTodo, valorPorHora } = regras.quadras || {};
  if (!valorPorHora) return 0;
  const [a, m, d] = data.split('-').map(Number);
  const diaSemana = new Date(a, m - 1, d).getDay();
  const fimDeSemana = diaSemana === 0 || diaSemana === 6;
  const paraMin = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));

  // Conta só as horas que caem no horário nobre
  let horasNobres = 0;
  for (let t = paraMin(inicio); t < paraMin(fim); t += 60) {
    if ((fimDeSemana && fimDeSemanaTodo) || t >= paraMin(aPartirDe)) horasNobres++;
  }
  return horasNobres * valorPorHora;
}
