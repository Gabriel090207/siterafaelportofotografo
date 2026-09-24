# Autenticação pública por link de Client

`POST /client/link-login` aceita exclusivamente `{"publicId":"...","secret":"..."}`.
Sucesso retorna apenas `{"customToken":"..."}`. Todas as respostas usam
`Cache-Control: no-store`. Credenciais inválidas retornam 401; indisponibilidade
interna retorna 503. Ambas usam `Link inválido ou indisponível.` sem detalhes.

O serviço reutiliza `ClientLinkService.validate`, sem descriptografar o segredo
nem duplicar lookup, hash ou credentialVersion. Confirma Client ativo, UID
canônico com vínculo único e Firebase User existente/habilitado. Revalida a
credencial e o documento após consultar Auth, antes de emitir token mínimo
para o UID canônico. Não cria usuários nem modifica credenciais ou sessões.

No frontend, `/cliente/acesso#publicId.secret` fica fora do guard de visitantes.
O formato atual exige publicId base64url de 22 caracteres e secret de 43.
A página remove o fragmento com `history.replaceState` antes de enviar o POST,
usa o helper compartilhado `signInWithCustomToken` e aguarda a confirmação do
UID pelo ClientAuthProvider antes de navegar para `/cliente/dashboard` com
replace. Um link de B substitui a sessão Firebase de A. Sem fragmento, inclusive
após refresh, não há nova troca: aparece erro genérico com acesso ao login.

Não há persistência manual de fragmento, segredo ou custom token. As referências
ficam limitadas ao processamento em memória; JavaScript não garante apagamento
físico imediato de strings. A persistência da sessão Firebase continua a cargo
do SDK e do fluxo existente. Não foram adicionados logs ou analytics.

## Pendências antes da exposição pública

Não foi encontrada infraestrutura de rate limiting no projeto. É obrigatório
limitar requisições antes de expor este endpoint publicamente, incluindo proteção
contra abuso de consultas Firestore e chamadas Auth. Nenhuma biblioteca ou
middleware foi instalado nesta etapa. Proxies, observabilidade e ferramentas de
analytics externas também devem evitar registrar corpos e credenciais.

Validação Firestore e emissão/consumo do token Firebase não são uma transação
atômica. A revalidação reduz a janela de corrida, mas não garante cancelamento
de token já emitido se houver revogação simultânea. Revogar/regenerar impede
novas trocas com o link antigo; não encerra sessões já existentes.

Os testes usam doubles locais: não validam credenciais Firebase reais, navegador
real nem configuração de produção. Admin, geração automática no provisionamento
e controles para copiar/revelar/regenerar/revogar continuam fora desta etapa.
