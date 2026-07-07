# Inventário do App Atual no Base44

Data da análise: 07/07/2026  
URL analisada: https://cardosofinance.base44.app/

## Rotas e navegação

- `/`: painel financeiro público/renderizado com navegação lateral/topo para Painel, Transações, Investimentos, Cripto, Guru e Config.
- `/transacoes`: lista de transações, importação com IA, criação rápida de despesa/receita e gerenciador de categorias inline.
- `/investimentos`: carteira de investimentos com abas Lista, FIIs, Categorias e Agrupado.
- `/guru`: Guru Financeiro com abas Chat, Análise, Insights, Metas e Memória.
- `/configuracoes`: preferências, exportação/importação, backup, IA, metas, segurança, cache, sobre, personalização da home e central de atualizações.
- `/mineracao`: mini game de moeda fictícia. Removido do escopo por decisão do usuário.
- `/Categories` e `/categories`: retornam 404 no app atual.
- `/login`, `/register`, `/forgot-password`, `/reset-password`: fluxo de autenticação existe, mas ainda com textos em inglês e títulos antigos `FinControl`.

## Branding encontrado no app original

- Marca visual principal anterior encontrada no Base44.
- Títulos de algumas páginas ainda usam `FinControl`, especialmente Transações, Investimentos, Login, Cadastro e recuperação de senha.
- Configurações mostram "Versão 1.0 · Cofrinho App" e "Desenvolvido por Base44 AI".
- Correção necessária: padronizar tudo como Cofrinho App.

## Painel

Elementos encontrados:

- Cards: Créditos, Despesas e Saldo.
- Filtro por mês com input `month`.
- Gráfico de visão mensal com alternância Barras/Linha.
- Despesas por categoria com estado vazio.
- Card Carteira de Investimentos com Investido, Atual, Rendimento e distribuição por classes.
- Card Fundos Imobiliários com Investido, Atual, Rendimento e gráfico comparando investido/atual.
- Acompanhamento de mercado de FIIs com botão Atualizar Agora.
- Filtro de categorias de investimento.
- Gráficos: Investimentos por Categoria e Evolução dos Investimentos.
- Aviso de nova versão v2.1.0 com changelog.

## Transações

Elementos encontrados:

- Botões: Todos, Importar com IA, Despesa, Receita, Gerenciar Categorias.
- Lista de transações em cards/linhas com descrição, categoria, data, recorrência e valor positivo/negativo.
- Modal de importação: aceita imagens PNG/JPG e PDF, múltiplos arquivos, botão "Analisar 0 arquivo(s) com IA".
- Modal de transação: tipo Despesa/Crédito, valor, categoria, data, descrição, recorrência e salvar.
- Gerenciador de categorias inline: lista categorias, total de transações por categoria e botão Nova Categoria.
- Modal de Nova Categoria: nome, tipo, cor e criar.

## Categorias

- Não existe rota dedicada no app atual.
- Há um gerenciador inline dentro de Transações.
- A reconstrução implementa uma página dedicada `/categorias`.

## Investimentos

Elementos encontrados:

- Botão Novo Investimento.
- Abas: Lista, FIIs, Categorias e Agrupado.
- Cards: Total Investido, Valor Atual e Rendimento.
- Alerta de vencimentos próximos com botão Confirmar vencimento.
- Lista de ativos com tipo, categoria, instituição, valores, rentabilidade, aplicação e vencimento quando houver.
- Modal Novo Investimento com tipo, nome, valor investido, valor atual, data de aplicação, vencimento, instituição, categoria e observações.
- Aba FIIs: atualização rápida de valores atuais, botão Salvar Tudo, upload de prints da corretora e lista de FIIs com cotas.
- Aba Categorias: atualização rápida por categoria, upload de prints da corretora, reordenação e cadastro de categoria de investimento.
- Aba Agrupado: ativos agrupados por categoria com valores e resultados.

## Guru

Elementos encontrados:

- Abas: Chat, Análise, Insights, Metas e Memória.
- Chat com atalhos: Como estou financeiramente?, Resuma meu mês, Analise meus investimentos, Analise meus FIIs, Onde estou gastando mais?, Como aumentar meu patrimônio?, O que devo acompanhar esta semana?
- Campo "Pergunte ao Guru...".
- Análise patrimonial com patrimônio, valor atual, rendimento, investimentos, receitas vs despesas e distribuição por categoria.
- Insights com tipos: Oportunidades, Gastos Excessivos, Categorias em Alta, Otimizações e Alertas.
- Metas com estado vazio e botão Nova Meta.
- Memória com perfil do usuário, idioma, moeda, mensagens salvas, perfil aprendido e histórico.

## Configurações

Elementos encontrados:

- Idioma, moeda, tema.
- Exportar/Importar Excel com 7 abas: Dashboard, Investimentos, FIIs, Receitas, Despesas, Categorias e Histórico Patrimonial.
- Modelo oficial de importação.
- Importação inteligente com IA: detecta colunas, transações, investimentos/FIIs e duplicatas.
- Backup e restauração JSON.
- IA: nome e personalização do assistente.
- Notificações.
- Metas financeiras.
- Segurança/PIN.
- Limpeza de cache.
- Sobre o aplicativo.
- Personalizar tela inicial.
- Central de atualizações com changelog filtrável.
- Redefinir configurações.

## Autenticação

Elementos encontrados:

- Login com Google e e-mail/senha.
- Cadastro com Google, e-mail, senha e confirmação.
- Esqueci minha senha.
- Reset de senha com estado de link inválido.
- Textos estão em inglês em várias partes; reconstrução deve usar pt-BR.

## Cripto/Mineracao

- A rota atual `/mineracao` é um mini game de moeda fictícia.
- O usuário pediu para pular essa página porque não quer mais o mini game no novo app.
- Decisão: remover navegação Cripto/Mineração; manter "Crypto" apenas como tipo de investimento.

## Referências externas analisadas

### Pierre Finance

Fonte: https://lp.pierre.finance/

Ideias úteis para adaptar:

- Chat em linguagem natural como experiência central.
- Leitura de extratos e identificação de padrões antes do usuário perguntar.
- Alertas de parcelas, assinaturas, cobranças duplicadas e comportamento fora do padrão.
- Objetivos financeiros acompanhados automaticamente.
- Mensagem forte de segurança: só leitura, sem movimentar dinheiro e sem pedir senha de banco.
- Relatórios e insights personalizados.

Adaptação para Cofrinho App:

- Manter o app sem conexão bancária obrigatória.
- Reforçar importação por CSV/print como alternativa segura.
- Guru deve dizer quando faltam dados e deve explicar análises em linguagem simples.

### Oinc

Fontes: https://www.useoinc.com.br/ e páginas oficiais nas lojas.

Ideias úteis para adaptar:

- Organizador financeiro com contas/cartões em um lugar.
- Categorização automática de despesas.
- Orçamentos mensais por categoria.
- Relatórios visuais.
- Acompanhamento de assinaturas e gastos recorrentes.
- Metas/cofrinho e ideia de guardar dinheiro sem perceber.
- Comunicação de segurança e simplicidade.

Adaptação para Cofrinho App:

- Orçamentos por categoria.
- Marcação de transações recorrentes.
- Metas financeiras com progresso.
- Futuro recurso "troco/cofrinho" pode virar sugestão do Guru, sem movimentação automática.
