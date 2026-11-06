# Media Hunter AI — Doktor Edition

MVP funcional para transformar SRT/TXT em cenas pesquisáveis, consultar mídias em múltiplas fontes, selecionar resultados e exportar uma lista com links/créditos.

## Recursos

- Importar `.srt` ou `.txt`, ou colar roteiro.
- Agrupar legendas por janelas de 8, 12, 18 ou 25 segundos; textos sem timestamps viram blocos.
- Sugestões de palavras-chave **heurísticas**, editáveis. Sem custo de IA. Recomenda-se pesquisar em inglês.
- Buscar fotos e vídeos em **Wikimedia Commons** e referências no **Internet Archive**, sem precisar de chave.
- Opcional: **Pixabay** e **YouTube** com API keys privadas; YouTube exibe links e thumbnails, não downloads.
- Selecionar itens por cena e exportar `CSV` ou `ZIP` contendo JSON e lista de fontes/créditos.
- Interface responsiva pronta para deploy na Vercel.

## Implantar na Vercel (mais fácil)

1. Descompacte a pasta `media-hunter-ai`.
2. Crie um repositório no GitHub, enviando os arquivos da pasta **sem incluir a pasta externa como nível extra**.
3. Na Vercel, escolha **Add New > Project > Import Git Repository**.
4. Deixe Framework Preset: `Vite`, Build Command: `npm run build`, Output Directory: `dist`.
5. Clique em **Deploy**.
6. Abra a URL gerada, clique em **Analisar roteiro**, selecione uma cena na esquerda e clique em **Buscar**.

### Fontes adicionais (opcionais)

Em Vercel > Project > Settings > Environment Variables, adicione:

- `PIXABAY_API_KEY`: obtenha em https://pixabay.com/api/docs/ (sujeito à disponibilidade e regras do serviço).
- `YOUTUBE_API_KEY`: ative a **YouTube Data API v3** em um projeto no Google Cloud. A busca utiliza cota; gastos podem ocorrer ao exceder cotas/condições.

Depois faça um **Redeploy**. **Nunca** coloque essas chaves em `VITE_` nem no GitHub. Sem as chaves, Commons e Archive continuam disponíveis.

## Executar localmente

Requisitos: Node.js 20+ e npm. Instale também a CLI da Vercel:

```bash
npm install
npm install -g vercel
vercel login
npm run dev
```

O comando `npm run dev` inicia o `vercel dev` que executa tanto a interface quanto a rota serverless `/api/search` (normalmente em `http://localhost:3000`). Na primeira execução, a CLI pode pedir para vincular o projeto à Vercel. `npm run dev:ui` **sozinho** inicia apenas a interface e precisa que o `vercel dev` esteja ativo em outra janela.

## Observações e limitações

- Não é um editor de vídeo e **não baixa os arquivos originais automaticamente**. O ZIP exporta um *manifest* com páginas de origem, licenças e créditos. A seleção é mantida apenas enquanto a página permanece aberta.
- **Licenças individuais precisam ser verificadas**, em especial material do Internet Archive e YouTube. Wikimedia inclui arquivos com requisitos de atribuição/compartilhamento pela mesma licença, entre outros.
- YouTube não é uma fonte de downloads de vídeo nesta ferramenta. A API serve apenas para encontrar e abrir vídeos.
- A interpretação das cenas não é feita por LLM: usa palavras-chave, regras e agrupa timestamps. Uma segunda versão pode integrar um modelo de linguagem opcional.
- Fontes externas podem limitar, bloquear ou alterar suas APIs; falhas parciais aparecem como avisos.
- Wikimedia Commons pode não devolver resultados para buscas muito específicas. Prefira termos em inglês de 2 a 4 palavras.
- Pixabay exige condições de atribuição/exibição de fonte em buscas por API e tem limites de frequência e cache; confira https://pixabay.com/api/docs/.

## Estrutura

- `src/main.jsx`: interface, fluxo de busca e exportação.
- `src/parse.js`: parser de roteiro e SRT, heurísticas de palavras-chave.
- `src/style.css`: identidade visual.
- `api/search.js`: função serverless de pesquisa, protege chaves.
- `vercel.json`: configuração de build/roteamento.

Uso experimental pessoal; não é afiliado a Wikimedia, Internet Archive, Pixabay, YouTube ou Vercel.
