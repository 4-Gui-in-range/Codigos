📘 FixMenu.jsx — Adobe InDesign ExtendScript
📖 Visão Geral

O FixMenu é um script desenvolvido em ExtendScript para Adobe InDesign que realiza auditoria, padronização e correção automática de estilos e formatação em documentos.

Ele foi criado para auxiliar equipes editoriais a manter consistência tipográfica e estrutural em grandes projetos, automatizando a detecção de problemas e propondo correções com poucos cliques.

Principais funcionalidades:

Validação e criação de estilos essenciais (ACERVO, TÓPICO, SUBTÓPICO, LISTA, REFERÊNCIA etc.).

Detecção de desvios de formatação (overrides, estilos de caractere aplicados incorretamente, ausência de small caps em versalete, espaçamentos incorretos).

Correção automática em lote com histórico de alterações.

Relatórios exportados em CSV para controle de qualidade.

Interface interativa via paleta (palette window) dentro do InDesign.

⚙️ Requisitos

Adobe InDesign (CS6 ou superior; testado em versões CC).

Suporte a ExtendScript habilitado.

Permissão de gravação no desktop do usuário (para exportar logs CSV).

📂 Instalação

Baixe o arquivo FixMenu.jsx
.

Copie o script para a pasta de scripts do InDesign:

Windows:
C:\Users\<SEU_USUARIO>\AppData\Roaming\Adobe\InDesign\<versão>\<idioma>\Scripts\Scripts Panel

macOS:
/Users/<SEU_USUARIO>/Library/Preferences/Adobe InDesign/<versão>/<idioma>/Scripts/Scripts Panel

Reinicie o InDesign (se já estiver aberto).

O script aparecerá no painel Scripts (Janela › Utilitários › Scripts).

🚀 Uso

Abra um documento do InDesign.

No painel Scripts, dê um duplo clique em FixMenu.jsx.

A paleta Fix Menu — Eduqi será aberta, exibindo as seguintes opções:

Controles principais

Buscar problemas → Escaneia o documento e lista inconsistências.

Parar → Interrompe um escaneamento em andamento.

Selecionar → Navega até o item selecionado na lista.

Aplicar conserto → Corrige automaticamente os problemas selecionados.

Registrar log → Gera um relatório CSV com status e detalhes de erros.

Opções adicionais

Regras pesadas (símbolos/math) → Ativa varredura de símbolos matemáticos (pode aumentar o tempo de processamento).

Lista de resultados

Exibe Página, Erro e Trecho de texto para cada problema encontrado.

Permite seleção múltipla para correção em lote.

🛠️ Funcionamento Interno

O script é dividido em módulos principais:

Cache de estilos (StyleCache): otimiza buscas repetitivas de estilos de parágrafo e caractere.

Regras (RULES): conjunto de verificações e correções, incluindo:

cfg_styles → Garante a existência dos estilos essenciais.

style_drift_guard → Detecta e corrige:

Aplicação indevida de estilos de caractere.

Overrides de formatação.

Versaletes sem small caps.

Espaçamento incorreto em listas/tópicos.

Sistema de relatórios: gera arquivos CSV no desktop com:

Data/hora da varredura.

Página afetada.

Tipo de erro.

Severidade (Alta, Média, Baixa).

Status (Aberto, Corrigido, Persistente).

Interface gráfica (UI): paleta personalizada com botões de controle e lista interativa.

📊 Relatórios

O log gerado é salvo no desktop como:

FixMenu-Correcoes<NOME_DO_DOCUMENTO>.csv


Formato de colunas:

Data/Hora;Status;Página;Tipo de Erro;Severidade;Descrição;Trecho;Parágrafo;Correção Aplicada;Observações


Exemplo:

2025-09-10 15:42;Corrigido;12;Formatação de Texto;Alta;VERSALETE sem small caps;"Capítulo I";;Sim;

⚠️ Limitações

A varredura de símbolos matemáticos pode ser lenta em documentos muito grandes.

Nem todos os tipos de erros de layout (órfãs/viúvas, hifenização, etc.) estão implementados.

É recomendado manter backup do documento antes de aplicar correções automáticas.

📌 Boas Práticas

Execute o script em cópias de documentos, especialmente em projetos grandes.

Utilize o log CSV como checklist para revisores.

Customize as regras no array RULES para se adequar ao fluxo editorial da sua equipe.

👨‍💻 Autor

Eduqi
Projeto criado para otimizar a revisão de documentos em InDesign.
