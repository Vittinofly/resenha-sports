import CartaoAcesso from '../cartao-acesso';
import FormularioNovaSenha from './formulario-nova-senha';

export const metadata = {
  title: 'Criar nova senha',
  robots: { index: false, follow: false },
};

export default function NovaSenhaPage() {
  return (
    <CartaoAcesso selo="Nova senha">
      <FormularioNovaSenha />
    </CartaoAcesso>
  );
}
