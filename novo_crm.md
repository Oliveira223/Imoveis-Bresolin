
### 1. Sobre os clientes
- Como as pessoas entram em contato hoje? (WhatsApp, formulário no site, redes sociais, telefone…)  
	instagram/facebook - link da plataforma 
- Vocês têm algum jeito de registrar esses contatos?  
	excel
- Vocês sentem que algum cliente “some” ou é esquecido?  
	sim
### 2. Sobre o trabalho da equipe
- Quantos corretores existem na imobiliária?  
	 whatsapp pessoal
- Todos atendem todos os clientes ou cada um tem seus próprios clientes?  
- É fácil acompanhar quem está atendendo qual cliente?  

### 3. Sobre expectativas
- Qual é o maior desafio hoje na hora de vender ou alugar imóveis?  
- O que ajudaria vocês a organizar melhor os clientes?  
- Já pensaram em usar o site para acompanhar leads e vendas de forma mais organizada?  

### 4. Sobre interesse em melhorias
- Se fosse possível ter um sistema que lembrasse de cada cliente e facilitasse acompanhar contatos e visitas, isso seria útil?  
- Gostariam de mensagens automatizadas no Whatsapp?
	sim
---


## Fluxo
link -> cadastro -> pg corretores -> funil

---
### Dados Cliente
(obrigatorios)
Nome
Telefone (formatar automaticamente)
Email  (existir @)
Imovel para 
- [ ] Moradia
- [ ] Investimento

Imovel Interesse (int [id])
Data cadastro 


Corretor atendendo (string)
Nível no funil (int)
Comentário (string)
Preço (int)
Quantidade de ligações -> vinculado com turno

---
### Dados corretor
nome 
senha
tarefas (texto) + horario + data
anotações 

## Página inicial
---
- Nav menu expandivel na esquerda 
	-  Aba que mostra os imoveis com clientes que perderam interesse 
- Filtrar Clientes
- Notificações expandiveis direita (talvez interesses do dia)-
- Botão criar tarefas


- Pesquisar cliente + filtro 
- Clientes novos
- Lead completo
- Interesses da semana (mostrar ultima conversa)



### Funil
- Cada aba vai mostrar
	- Valor total (soma dos clintes)
	- Tempo desde a ultima interação do cliente

- Ordenar por cliente mais antigo


1. **LEAD** (cadastro inicial)
- [ ] Entra em contato -> Lista Ligar novamente (3 vezes) -> 
- [ ] Não respondeu -> Ligar no proximo turno (3 vezes) -> +3x 24h depois -> Lista Ingnorado
- [ ] Respondeu

2. **Leads** Falado (respondeu)
- [ ] Tem interesse
- [ ] Não tem interesse -> lista de não interessados
- [ ] Visita agendada

3. **Visita** realizada ()
- [ ] Venda realizada -> 5
- [ ] Sem interesse -> lista de interesse
- [ ] Proposta feita

4. **Proposta** 
- [ ] Aceita -> Venda
- [ ] Negou -> Fica no nivel

5. **Venda** (fechou)
- [ ] Lista de contratos
### Página do corretor
- LOgin inicial
- Lista Clientes (novos primeiros)

### IDEIAS:
- lembrete de clientes "esquecidos"
- Botão para mover Lista Clientes inativos
-  Aba para clientes novos
-  Criar página de cadastro personalizada para cada imovel
- Mapa de localização de imoveis
-  Tentar integrar imoveis orulo com site (talvez colocar link e puxar info via web js)

- Página imoveisbresolin.com.br/corretores para cada corretor especifico
> Cadastro de corretores pelo painel admin
   Nome tem que ir para o banco de dados

- Marca da agua nas fotos

### Correções:
Aluguel da home não está passando para filtro de imoveis
Mudar setas e fechar da visualização de imagens

Seta na foto principal para ir para secundárias
- Ordenar ordem das fotos

- imobiliaria@imoveisbresolin.com.br

## Ideias futuras
Conexão OLX
Puxar imoveis Orulo
