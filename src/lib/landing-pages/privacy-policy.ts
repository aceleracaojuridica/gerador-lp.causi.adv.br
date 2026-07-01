import type { Office } from "./schema";

// Modelo padrão (LGPD) usado quando o escritório não escreve a própria política.
// Mesma fonte para o preview e para a página publicada (/[slug]/politica-de-privacidade).
export function defaultPrivacyPolicy(office: Office): string {
  const nome = office.fullName || office.name || "o escritório";
  const email = office.email?.trim();
  return [
    `Esta Política de Privacidade descreve como ${nome} coleta, usa e protege as informações fornecidas por você nesta página.`,
    "",
    "1. Dados coletados",
    "Coletamos os dados que você nos envia voluntariamente pelo formulário de contato (como nome e telefone), com a finalidade de entrar em contato e prestar atendimento jurídico.",
    "",
    "2. Uso das informações",
    "Os dados são usados apenas para responder à sua solicitação e oferecer nossos serviços. Não vendemos nem compartilhamos seus dados com terceiros, exceto quando necessário para cumprir obrigações legais.",
    "",
    "3. Armazenamento e segurança",
    "Adotamos medidas razoáveis para proteger seus dados contra acesso não autorizado e os mantemos pelo tempo necessário ao atendimento.",
    "",
    "4. Seus direitos (LGPD)",
    "Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode, a qualquer momento, solicitar o acesso, a correção ou a exclusão dos seus dados.",
    "",
    "5. Contato",
    email
      ? `Para exercer seus direitos ou tirar dúvidas, entre em contato pelo e-mail ${email}.`
      : "Para exercer seus direitos ou tirar dúvidas, entre em contato pelos canais informados nesta página.",
  ].join("\n");
}
