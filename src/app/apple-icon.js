import { ImageResponse } from 'next/og';
import { IconeMarca } from '@/lib/icone-marca';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// O iOS aplica o próprio arredondamento: o ícone vai com cantos retos.
export default function AppleIcon() {
  return new ImageResponse(<IconeMarca tamanho={size.width} arredondado={false} />, size);
}
