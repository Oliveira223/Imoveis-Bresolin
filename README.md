# Sistema de Gestão Imobiliária - Documentação Técnica

## 📋 Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Tecnologias e Componentes](#2-tecnologias-e-componentes)
3. [Modelo de Dados](#3-modelo-de-dados)
4. [Fluxo de Dados Backend](#4-fluxo-de-dados-backend)
5. [Interface e Experiência do Usuário](#5-interface-e-experiência-do-usuário)
6. [Sistema de Autenticação](#6-sistema-de-autenticação)
7. [Processamento de Requisições](#7-processamento-de-requisições)
8. [Gestão de Arquivos e Imagens](#8-gestão-de-arquivos-e-imagens)
9. [Otimização de Imagens com Cloudflare](#9-otimização-de-imagens-com-cloudflare)
10. [Mecanismo de Busca](#10-mecanismo-de-busca)
11. [Automação e Manutenção](#11-automação-e-manutenção)
12. [Infraestrutura e Deploy](#12-infraestrutura-e-deploy)
13. [Ambiente de Produção VPS](#13-ambiente-de-produção-vps)
14. [Segurança e Proteção](#14-segurança-e-proteção)
15. [Configuração e Operação](#15-configuração-e-operação)

---

## 1. Visão Geral da Arquitetura

O sistema Bresolin Imóveis implementa uma arquitetura web clássica de três camadas, onde cada componente tem responsabilidades bem definidas. A camada de apresentação gerencia toda a interface visual que os usuários veem e interagem, incluindo páginas web responsivas e formulários dinâmicos. A camada de lógica de negócio processa todas as regras específicas do domínio imobiliário, como cálculos de preços, validações de dados e fluxos de aprovação. A camada de dados mantém a persistência e integridade de todas as informações do sistema.

A comunicação entre essas camadas segue um fluxo unidirecional bem estruturado. Quando um usuário interage com a interface, a requisição passa pela camada de apresentação, é processada pela lógica de negócio que pode consultar ou modificar dados na camada de persistência, e então uma resposta é formatada e enviada de volta ao usuário. Este padrão garante separação de responsabilidades e facilita manutenção e evolução do sistema.

O sistema opera como uma aplicação monolítica containerizada, onde todos os componentes principais executam em um ambiente isolado e controlado. Esta abordagem simplifica o deployment e garante consistência entre diferentes ambientes de execução, desde desenvolvimento local até produção.

## 2. Tecnologias e Componentes

O backend utiliza Python como linguagem principal, aproveitando sua sintaxe clara e vasto ecossistema de bibliotecas. O framework Flask foi escolhido por sua simplicidade e flexibilidade, permitindo desenvolvimento ágil sem impor estruturas rígidas. Flask gerencia o roteamento de URLs, renderização de templates e processamento de requisições HTTP.

Para persistência de dados, PostgreSQL atua como sistema de gerenciamento de banco relacional, oferecendo robustez, performance e recursos avançados como transações ACID e consultas complexas. A comunicação entre Python e PostgreSQL acontece através do SQLAlchemy, que fornece uma camada de abstração orientada a objetos sobre SQL puro.

O frontend combina HTML semântico para estrutura, CSS moderno para estilização e JavaScript para interatividade. A biblioteca jQuery simplifica manipulação de DOM e requisições AJAX, permitindo atualizações dinâmicas de conteúdo sem recarregamento completo de páginas.

A containerização via Docker encapsula toda a aplicação e suas dependências em ambientes isolados e reproduzíveis. Docker Compose orquestra múltiplos containers, definindo como eles se comunicam e compartilham recursos.

## 3. Modelo de Dados

O modelo de dados reflete as entidades e relacionamentos naturais do mercado imobiliário. A entidade central "imóveis" armazena todas as características físicas e comerciais de cada propriedade: localização, dimensões, preço, tipo de negociação e status atual. Cada imóvel possui um identificador único e timestamps que rastreiam quando foi criado e modificado.

A entidade "empreendimento" agrupa múltiplos imóveis, como edifícios residenciais ou loteamentos. Esta relação permite gestão centralizada de informações comuns a várias unidades, como data de entrega, características do projeto e documentação legal.

Imagens são tratadas como entidades separadas relacionadas aos imóveis, permitindo múltiplas fotos por propriedade. Cada imagem é categorizada por tipo (principal, secundária, planta) e possui ordem de exibição, oferecendo flexibilidade na apresentação visual.

O sistema mantém logs de acesso que registram visualizações de imóveis com informações de timestamp e origem, alimentando relatórios analíticos sobre comportamento dos usuários e popularidade das propriedades.

Relacionamentos entre entidades são implementados através de chaves estrangeiras com constraints de integridade referencial, garantindo consistência dos dados mesmo em operações concorrentes.

## 4. Fluxo de Dados Backend

Quando a aplicação inicia, ela carrega configurações de variáveis de ambiente, estabelece conexão com o banco de dados e configura rotas de URL. O sistema fica então aguardando requisições HTTP na porta configurada.

Para requisições de páginas públicas, o fluxo começa com o roteador Flask identificando qual função deve processar a URL solicitada. Esta função executa consultas no banco de dados para buscar informações relevantes, como lista de imóveis ou detalhes de uma propriedade específica. Os dados são então passados para um template HTML que gera a página final enviada ao navegador.

Requisições administrativas passam primeiro por uma camada de autenticação que verifica credenciais antes de permitir acesso. Operações de criação ou modificação de dados incluem validação rigorosa de entrada, sanitização de conteúdo e verificação de regras de negócio antes de persistir informações no banco.

APIs REST processam requisições AJAX do frontend, retornando dados em formato JSON. Estas APIs implementam operações CRUD (Create, Read, Update, Delete) com tratamento de erros e códigos de status HTTP apropriados.

O sistema mantém logs detalhados de todas as operações, incluindo acessos, modificações de dados e erros, facilitando debugging e auditoria.

## 5. Interface e Experiência do Usuário

A interface pública foi projetada para maximizar conversão de visitantes em leads qualificados. A página inicial apresenta uma animação SVG personalizada que desenha o logo da empresa, criando impacto visual imediato e transmitindo profissionalismo.

O formulário de busca ocupa posição estratégica, permitindo que usuários iniciem sua jornada de descoberta imediatamente. Filtros são organizados intuitivamente, com validação em tempo real e feedback visual para melhorar a experiência.

Páginas de resultados implementam carregamento progressivo, mostrando apenas uma quantidade limitada de imóveis por vez para otimizar performance. Filtros laterais permitem refinamento da busca com contadores dinâmicos mostrando quantos imóveis correspondem a cada critério.

A página individual de cada imóvel maximiza impacto visual através de galeria responsiva com navegação suave entre imagens. Informações são organizadas em seções lógicas que facilitam escaneamento rápido pelos visitantes.

Integração com WhatsApp elimina barreiras de comunicação, gerando automaticamente mensagens pré-formatadas com informações do imóvel de interesse.

## 6. Sistema de Autenticação

O sistema implementa autenticação HTTP Basic para proteger áreas administrativas. Este método envia credenciais codificadas em Base64 no cabeçalho de cada requisição, sendo verificadas pelo servidor antes de permitir acesso.

Credenciais administrativas são armazenadas como variáveis de ambiente, mantendo informações sensíveis fora do código fonte. O sistema verifica estas credenciais através de um decorator que intercepta requisições para rotas protegidas.

Quando credenciais são inválidas ou ausentes, o servidor retorna status HTTP 401 com cabeçalho WWW-Authenticate, fazendo o navegador exibir automaticamente uma caixa de diálogo para entrada de usuário e senha.

Sessões administrativas não possuem timeout automático, mas podem ser invalidadas fechando o navegador ou limpando credenciais armazenadas.

## 7. Processamento de Requisições

O sistema processa diferentes tipos de requisições através de rotas específicas. Requisições GET para páginas públicas executam consultas de leitura no banco de dados, formatam dados através de templates Jinja2 e retornam HTML completo.

Requisições POST de formulários passam por validação de dados, onde campos obrigatórios são verificados, tipos de dados são validados e regras de negócio são aplicadas. Dados válidos são então inseridos ou atualizados no banco de dados.

APIs AJAX processam requisições assíncronas do frontend, retornando dados em formato JSON. Estas requisições permitem atualizações dinâmicas de conteúdo sem recarregamento completo de páginas.

Upload de arquivos recebe tratamento especial, com validação de tipo, tamanho e conteúdo antes de armazenar arquivos no sistema de arquivos do servidor.

Todas as requisições passam por middleware que adiciona cabeçalhos de segurança, registra logs de acesso e trata exceções de forma centralizada.

## 8. Gestão de Arquivos e Imagens

O sistema de upload implementa múltiplas camadas de validação para garantir segurança. Primeiro, verifica-se a extensão do arquivo contra uma lista de tipos permitidos. Em seguida, o tipo MIME é validado para confirmar que o arquivo é realmente uma imagem.

Arquivos recebem nomes únicos gerados automaticamente para evitar conflitos e facilitar organização. O sistema cria uma estrutura hierárquica de diretórios baseada no tipo de conteúdo e identificador do imóvel.

Imagens são categorizadas em três tipos principais: principal (foto de destaque), secundárias (galeria adicional) e plantas (layouts e plantas baixas). Esta categorização permite apresentação organizada e funcionalidades específicas para cada tipo.

O sistema gera automaticamente versões reduzidas (thumbnails) das imagens para otimizar carregamento em listagens e galerias. Diferentes tamanhos são criados para diferentes contextos de uso.

Referências às imagens são armazenadas no banco de dados como caminhos relativos, permitindo migração de arquivos sem afetar a aplicação. Quando imóveis são removidos, o sistema automaticamente limpa arquivos órfãos.

## 9. Otimização de Imagens com Cloudflare

O sistema utiliza Cloudflare como CDN (Content Delivery Network) para otimização e entrega eficiente das imagens dos imóveis. Esta implementação melhora significativamente a performance do site e a experiência do usuário através de múltiplas camadas de otimização.

O Cloudflare atua como um proxy inteligente entre os visitantes e o servidor, interceptando requisições de imagens e aplicando otimizações automáticas. Quando um usuário acessa uma página com fotos de imóveis, as imagens são servidas a partir dos data centers globais do Cloudflare, reduzindo drasticamente o tempo de carregamento.

A compressão automática de imagens reduz o tamanho dos arquivos sem perda perceptível de qualidade, utilizando algoritmos avançados que analisam o conteúdo e aplicam a melhor estratégia de compressão para cada tipo de imagem. Formatos modernos como WebP são servidos automaticamente para navegadores compatíveis, oferecendo compressão superior.

O redimensionamento dinâmico permite que a mesma imagem seja entregue em diferentes tamanhos conforme a necessidade, eliminando a necessidade de armazenar múltiplas versões no servidor. Dispositivos móveis recebem automaticamente versões otimizadas para suas telas, enquanto desktops recebem imagens em alta resolução.

O cache global distribui as imagens através de uma rede mundial de servidores, garantindo que usuários de qualquer localização tenham acesso rápido ao conteúdo. Este cache é inteligente, renovando automaticamente quando imagens são atualizadas no servidor origem.

A proteção contra hotlinking impede que outros sites utilizem as imagens diretamente do servidor, economizando largura de banda e protegendo os recursos visuais da empresa. Regras personalizadas podem ser configuradas para diferentes tipos de acesso.

## 10. Mecanismo de Busca

O sistema de busca implementa múltiplas estratégias para maximizar relevância dos resultados. Busca textual utiliza correspondência parcial em títulos, descrições e endereços, com normalização de texto que remove acentos e diferenças de capitalização.

Filtros numéricos permitem definição de ranges para preço, área e número de quartos. O sistema constrói consultas SQL dinâmicas combinando múltiplos critérios, garantindo que apenas imóveis que atendem todos os filtros sejam retornados.

Resultados são ordenados por relevância usando algoritmo de scoring que considera múltiplos fatores: correspondência exata no título tem peso maior, seguida por correspondência parcial, localização e características similares.

O sistema oferece autocomplete que sugere cidades, bairros e nomes de empreendimentos conforme o usuário digita. Estas sugestões são geradas através de consultas otimizadas que buscam correspondências parciais em tempo real.

Paginação eficiente carrega apenas resultados visíveis, melhorando performance especialmente em catálogos extensos. Usuários podem escolher diferentes critérios de ordenação como preço, área ou data de cadastro.

## 11. Automação e Manutenção

O sistema inclui rotinas automatizadas que executam tarefas de manutenção sem intervenção manual. Backup do banco de dados é executado regularmente, criando cópias comprimidas organizadas por data para facilitar recuperação.

Relatórios semanais são gerados automaticamente, compilando métricas sobre performance do site, novos imóveis cadastrados e estatísticas de acesso. Estes relatórios são enviados por email para gestores e equipe de vendas.

O sistema monitora logs de erro e pode enviar alertas automáticos quando problemas recorrentes são detectados. Métricas de performance como tempo de resposta e uso de recursos são coletadas continuamente.

Limpeza automática remove arquivos órfãos, logs antigos e dados temporários, mantendo o sistema otimizado. Estas rotinas são agendadas para executar em horários de baixo tráfego.

## 12. Infraestrutura e Deploy

A aplicação é containerizada usando Docker, encapsulando código, dependências e configurações em ambientes isolados e reproduzíveis. Dois containers principais compõem o sistema: um para a aplicação Flask e outro para o banco PostgreSQL.

Docker Compose orquestra estes containers, definindo como eles se comunicam, compartilham volumes e acessam recursos de rede. Volumes persistentes garantem que dados do banco sobrevivam a restarts e atualizações.

O pipeline de deploy utiliza GitHub Actions para automação completa desde commit até produção. Quando código é enviado para o repositório principal, testes automatizados são executados, imagens Docker são construídas e o deploy é realizado automaticamente.

Estrategias de deploy blue-green minimizam downtime durante atualizações, mantendo a versão anterior rodando enquanto a nova é preparada e testada. Rollback automático é ativado se problemas são detectados.

Monitoramento contínuo coleta métricas de sistema e aplicação, incluindo uso de CPU, memória, tempo de resposta e taxa de erro. Alertas são configurados para condições críticas.

## 13. Ambiente de Produção VPS

O sistema opera em um ambiente de produção robusto hospedado em VPS (Virtual Private Server) dedicado, oferecendo controle total sobre a infraestrutura e garantindo performance consistente para os usuários finais.

A VPS utilizada possui configuração otimizada para aplicações web Python, com recursos dimensionados para suportar o tráfego esperado e picos de acesso. O servidor conta com SSD para armazenamento rápido, múltiplos cores de CPU para processamento paralelo e memória RAM suficiente para cache eficiente do banco de dados.

O sistema operacional Linux Ubuntu LTS fornece estabilidade e segurança de longo prazo, com atualizações regulares de segurança aplicadas automaticamente. A escolha por uma distribuição LTS garante suporte estendido e compatibilidade com as tecnologias utilizadas.

Nginx atua como proxy reverso na frente da aplicação Flask, oferecendo múltiplos benefícios: terminação SSL/TLS, compressão gzip automática, cache de arquivos estáticos, balanceamento de carga e proteção contra ataques DDoS básicos. Esta configuração melhora significativamente a performance e segurança.

O Docker Compose orquestra todos os serviços em produção, incluindo a aplicação Flask, banco PostgreSQL, Nginx e ferramentas de monitoramento. Esta abordagem containerizada garante isolamento entre serviços e facilita atualizações sem downtime.

Backups automatizados são executados semanalmente, criando snapshots completos do sistema e backups incrementais do banco de dados. Estes backups são armazenados tanto localmente quanto em storage externo, garantindo múltiplas camadas de proteção contra perda de dados.

Monitoramento contínuo acompanha métricas vitais do servidor: uso de CPU, memória, espaço em disco, tráfego de rede e tempo de resposta da aplicação. Alertas automáticos são enviados quando thresholds críticos são atingidos, permitindo intervenção proativa.

O firewall configurado permite apenas tráfego necessário, bloqueando portas desnecessárias e implementando rate limiting para prevenir ataques de força bruta. Fail2ban monitora logs de acesso e bloqueia automaticamente IPs suspeitos.

Certificados SSL são gerenciados através do Let's Encrypt com renovação automática, garantindo que a comunicação entre usuários e servidor permaneça sempre criptografada. HTTPS é obrigatório para todas as conexões, com redirecionamento automático de HTTP.

Logs centralizados coletam informações de todos os serviços, facilitando debugging e análise de performance. Rotação automática de logs previne que arquivos cresçam indefinidamente e consumam espaço em disco.

Procedimentos de deploy automatizados através de GitHub Actions permitem atualizações rápidas e seguras, com rollback automático em caso de problemas. O processo inclui testes automatizados, build de imagens Docker e deploy gradual para minimizar impacto.

## 14. Segurança e Proteção

O sistema implementa múltiplas camadas de proteção contra ameaças comuns. Validação rigorosa de entrada previne ataques de injeção SQL e cross-site scripting (XSS). Todos os dados recebidos são sanitizados e validados antes de processamento.

Upload de arquivos inclui verificação de tipo MIME, validação de extensão e scanning de conteúdo malicioso. Arquivos são armazenados fora do diretório web quando possível, reduzindo riscos de execução de código malicioso.

Cabeçalhos de segurança HTTP são configurados para proteger contra ataques de clickjacking, sniffing de conteúdo e outros vetores comuns. Content Security Policy restringe fontes de recursos externos.

HTTPS é obrigatório em produção, com redirecionamento automático de conexões inseguras. Certificados SSL são renovados automaticamente para manter criptografia sempre atualizada.

Backups são criptografados e armazenados em múltiplas localizações para proteção contra perda de dados. Acesso a backups é restrito e auditado.

## 15. Configuração e Operação

A configuração inicial requer Docker e Docker Compose instalados no sistema. Após clonar o repositório, variáveis de ambiente devem ser configuradas através do arquivo .env, incluindo credenciais de banco, configurações de email e chaves administrativas.

Para desenvolvimento local, recomenda-se executar apenas o banco via Docker e rodar a aplicação Flask diretamente, facilitando debugging e desenvolvimento iterativo. Dependências Python são gerenciadas através do arquivo requirements.txt.

Produção utiliza Docker Compose completo, iniciando todos os serviços em containers isolados. Volumes persistentes garantem que dados sobrevivam a restarts e atualizações.

Inicialização do banco é realizada através de script dedicado que cria todas as tabelas e relacionamentos necessários. Este script pode ser executado múltiplas vezes sem causar problemas.

Monitoramento de saúde pode ser implementado através de endpoints dedicados que verificam conectividade do banco e integridade básica do sistema. Load balancers podem utilizar estes endpoints para health checks automáticos.

Logs são acessíveis através de comandos Docker Compose, permitindo monitoramento em tempo real de atividade do sistema e debugging de problemas. Diferentes níveis de log podem ser configurados conforme necessidade.

Backup e restauração de dados seguem procedimentos padronizados usando ferramentas nativas do PostgreSQL. Scripts automatizados facilitam estas operações e garantem consistência dos procedimentos.

O sistema foi projetado para ser facilmente mantido e expandido, com arquitetura modular que permite adição de novas funcionalidades sem impactar componentes existentes.