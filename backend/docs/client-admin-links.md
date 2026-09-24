# Criação de Client e cópia administrativa de link

## Configuração

Configure `PUBLIC_FRONTEND_URL` no ambiente do backend com a origem do frontend
público, sem caminho, query, fragmento ou credenciais. Em produção:

```dotenv
PUBLIC_FRONTEND_URL=https://www.rafaelportofotografia.com.br
```

Defina essa variável nas configurações de ambiente do **serviço backend que
executa a API FastAPI**, no provedor de deploy, e reinicie/reimplante esse
serviço para carregar o valor. Não é uma variável `VITE_*` do admin/frontend.
Não há manifesto de deploy ou `.env.example` no projeto que configure esse
ambiente remoto; esta documentação não configura a produção automaticamente.
O `backend/.env` é local e ignorado pelo Git; seus valores e secrets foram
preservados.

A base com ou sem `/` final é aceita: `public_frontend_base()` já aplica
`rstrip("/")` antes de concatenar `/cliente/acesso`. O resultado é sempre
`https://www.rafaelportofotografia.com.br/cliente/acesso#publicId.secret`, sem
`//cliente/acesso`, sem segredo na query e sem persistir a URL completa.

Para desenvolvimento com frontend local, use por exemplo:

```dotenv
PUBLIC_FRONTEND_URL=http://localhost:5173
```

Use a porta real do frontend público, não a do admin. Fora de localhost,
127.0.0.1 e ::1, a origem deve usar HTTPS. Nenhum segredo foi adicionado ao
repositório.

O keyring existente (`CLIENT_PASSWORD_ACTIVE_KEY_ID` e
`CLIENT_PASSWORD_KEYS_JSON`) agora é necessário para **toda criação de Client**,
inclusive sem e-mail/senha, pois a credencial do link é obrigatória. Não gere
novas chaves a cada deploy: links existentes precisam da chave que os cifrou.
A base pública só é necessária para obter a URL administrativa; o
provisionamento persiste a credencial, não a URL.

## Backend

`POST /admin/clients` prepara a credencial do link por meio de `ClientLinkService`
antes de criar o usuário Firebase. O mesmo candidato é reutilizado em retries.
Client, reservas de e-mail, password opcional, link e lookup são gravados na mesma
transação Firestore, com todas as leituras antes das escritas. A resposta de
criação permanece igual, sem link ou segredo.

Falha confirmada sem Client persistido mantém a compensação que remove apenas o
Firebase User recém-criado. Em resposta de commit perdida, a confirmação exige
Client e a credencial/lookup exatos. Resultado incerto ou documento conflitante
exige reconciliação e não remove cegamente o usuário Auth. Auth e Firestore não
formam uma transação distribuída.

`POST /admin/clients/{clientId}/link` exige `get_authenticated_admin`. Confirma a
existência do Client e usa `ClientLinkService.get_or_create`:

- novo Client: recupera o link criado no provisionamento;
- legado sem link: cria somente para esse Client, sob demanda;
- cliques posteriores: recuperam o mesmo link;
- link explicitamente revogado: responde 409, sem reativar nem regenerar;
- Client ausente: 404; falha operacional/configuração: 503.

Sucesso retorna somente:

```json
{"shareLink":"https://www.rafaelportofotografia.com.br/cliente/acesso#PUBLIC_ID.SECRET"}
```

As respostas do handler usam `Cache-Control: no-store`. A origem vem
exclusivamente da configuração, sem domínio hardcoded na lógica Python. A URL é montada em
memória, nunca gravada no Firestore. Não são retornados hash, cifra, versão,
chave, UID ou password. Não há logs de segredo/link/corpo de resposta.

O login público do passo anterior permanece inalterado. Client inativo ou UID
sem Firebase User válido não consegue autenticar, mesmo que o admin obtenha seu
link. O rate limiting da troca pública continua obrigatório antes de exposição
pública, conforme `client-link-login.md`.

## Admin

ClientForm mantém a revisão e, após confirmar, reutiliza `LoadingModal` e seu
CSS: spinner, progresso, check de sucesso, 900 ms em sucesso e 350 ms de saída,
seguidos do toast existente e navegação para `/clients`. A requisição única não
fornece progresso granular: começa em 5% e só chega a 100% após resposta positiva.
A nova prop opcional `successHint` adapta o destino textual; seu padrão mantém o
texto e comportamento existentes dos Álbuns. Erros fecham o loading e retornam ao formulário com os dados preservados, sem
reabrir a revisão, mostrar sucesso ou navegar. O erro e o aviso de resultado
incerto aparecem somente pelo toast. Uma nova tentativa exige nova revisão.

Tabela e cards mantêm a ordem lápis → link → lixeira, usando os mesmos botões de
38 px e ícones de 18 px do `lucide-react`. A cópia usa Link/Loader2 e ToastContext.
Um Set de IDs bloqueia duplicatas inclusive entre tabela e cards, somente durante
a requisição/cópia daquele Client. Outros Clients continuam disponíveis.

`navigator.clipboard.writeText` recebe o link apenas em memória. Não há navegação,
modal de link ou armazenamento em localStorage/sessionStorage. Toast de sucesso
só aparece depois da cópia resolvida. Falha do backend e falha de clipboard têm
feedback separado. Não havia fallback existente: indisponibilidade, permissão
negada ou perda de ativação do usuário em alguns navegadores resulta em toast de
erro; não há fallback novo. Clipboard depende de contexto seguro/permissões e
seu conteúdo permanece na área de transferência do sistema por decisão do usuário.

Os botões de editar/excluir já não tinham handlers na listagem investigada e
continuam assim; essa etapa não implementa essas ações.

## Validação manual (não executada automaticamente)

1. Configure a origem pública e o keyring em ambiente de teste.
2. Crie um Client ativo sem preencher campos. Revise e confirme. Confira loading,
   check de sucesso, transição e retorno a `/clients`, sem modal de link.
3. Confira lápis → link → lixeira na tabela e no mobile. Clique link e aguarde
   “Link copiado com sucesso.”.
4. Cole em janela anônima: o fragmento deve desaparecer e o login deve levar à
   área do Client correto. Confira também com uma sessão de outro Client aberta.
5. Copie novamente: deve ser exatamente o mesmo link.
6. Repita com Client legado válido sem credencial de link: o primeiro clique cria,
   o segundo recupera o mesmo. Outros legados não devem ganhar credenciais.
7. Repita criação com e-mails sem senha e com e-mails/senha.
8. Simule clipboard negado/indisponível: deve haver erro, sem toast de sucesso.
   Simule falha do backend e link revogado: sem cópia ou reativação.
9. Durante uma request lenta, tente cliques repetidos no mesmo Client e em outro:
   só o primeiro fica bloqueado. Na falha de criação, confira dados preservados,
   ausência de navegação e orientação de verificação antes de repetir se incerto.

Os testes automatizados usam doubles locais, sem chamadas de produção. Não há
UI de regenerar/revogar, modal de link, password reveal ou backfill global.
