import { ImageResponse } from 'next/og';
import { IconeMarca } from '@/lib/icone-marca';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(<IconeMarca tamanho={size.width} />, size);
}
