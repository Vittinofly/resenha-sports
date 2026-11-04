// Utilitários de data, hora, moeda e WhatsApp.
// Datas trafegam como 'YYYY-MM-DD' no fuso LOCAL. Nunca use toISOString() para
// obter "hoje": ele usa UTC e, no Brasil, vira o dia seguinte após as 21h.

export function dataLocalISO(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function somarDias(dataISO, dias) {
  const [a, m, d] = dataISO.split('-').map(Number);
  return dataLocalISO(new Date(a, m - 1, d + dias));
}

function paraDate(dataISO) {
  const [a, m, d] = dataISO.split('-').map(Number);
  return new Date(a, m - 1, d);
}

const maiusculaInicial = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// 'Qui., 29 de out.'
export function formatarDataCurta(dataISO) {
  if (!dataISO) return '';
  return maiusculaInicial(paraDate(dataISO).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }));
}

// '29/10/2026'
export function formatarData(dataISO) {
  if (!dataISO) return '';
  const [a, m, d] = dataISO.split('-');
  return `${d}/${m}/${a}`;
}

// 'Quinta-feira, 29 de outubro'
export function formatarDataLonga(dataISO) {
  if (!dataISO) return '';
  return maiusculaInicial(paraDate(dataISO).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }));
}

export function rotuloDia(dataISO, hojeISO) {
  if (!hojeISO) return formatarDataCurta(dataISO);
  if (dataISO === hojeISO) return 'Hoje';
  if (dataISO === somarDias(hojeISO, 1)) return 'Amanhã';
  return formatarDataCurta(dataISO);
}

// --- HORAS ---
export function horaParaMinutos(hora) {
  if (!hora) return 0;
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutosParaHora(minutos) {
  const limitado = Math.min(minutos, 23 * 60 + 59);
  return `${String(Math.floor(limitado / 60)).padStart(2, '0')}:${String(limitado % 60).padStart(2, '0')}`;
}

// Supabase pode devolver 'HH:MM:SS'; a UI sempre mostra 'HH:MM'.
export function hhmm(hora) {
  return hora ? hora.slice(0, 5) : '';
}

export function intervalosSobrepoem(inicioA, fimA, inicioB, fimB) {
  return horaParaMinutos(inicioA) < horaParaMinutos(fimB) && horaParaMinutos(fimA) > horaParaMinutos(inicioB);
}

// --- MOEDA ---
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarMoeda(valor) {
  return moeda.format(Number(valor) || 0);
}

export function lerPreco(texto) {
  const normalizado = String(texto).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const numero = parseFloat(normalizado);
  return Number.isFinite(numero) ? numero : NaN;
}

// --- TELEFONE ---
export function apenasDigitos(valor) {
  return String(valor || '').replace(/\D/g, '');
}

// '11999998888' -> '(11) 99999-8888'
export function formatarTelefone(valor) {
  const d = apenasDigitos(valor).replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function telefoneValido(valor) {
  const d = apenasDigitos(valor);
  return d.length === 10 || d.length === 11;
}

export function linkWhatsApp(numero, mensagem = '') {
  const d = apenasDigitos(numero);
  if (!d) return '';
  const comDDI = d.startsWith('55') && d.length > 11 ? d : `55${d}`;
  return `https://wa.me/${comDDI}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''}`;
}

export function primeiroNome(nome) {
  return String(nome || '').split('|')[0].trim().split(/\s+/)[0] || '';
}
