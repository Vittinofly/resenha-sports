import CartaoAcesso from './cartao-acesso';
import FormularioLogin from './formulario-login';

export const metadata = {
  title: 'Acesso da equipe',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <CartaoAcesso>
      <FormularioLogin />
    </CartaoAcesso>
  );
}
