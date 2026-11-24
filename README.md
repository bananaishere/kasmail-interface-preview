# k@sMail · Pré-visualização da interface

[Abrir a demonstração](https://bananaishere.github.io/kasmail-interface-preview/)

Esta demonstração apresenta a nova página de Atividade, a Entrada com categorias, a agenda e o perfil. Em **Perfil e definições → Aparência**, podes alternar entre Claro e Escuro.

Os emails, a ligação da carteira, a disponibilidade dos nós e a cotação KAS são exemplos. A página guarda as alterações da demonstração no navegador. O botão de backup exporta os emails, categorias e lembretes de exemplo como JSON.

## Executar localmente

Com Node.js 24 instalado:

```sh
npm ci
npm run dev
```

Para gerar a versão estática, usa `npm run build`. Os ficheiros ficam em `dist/`.
