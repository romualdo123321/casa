export interface EmoticonItem {
  code: string;
  emoji: string;
  name: string;
  aliases?: string[];
}

export const MSN_EMOTICONS: EmoticonItem[] = [
  { code: ':)', emoji: '😊', name: 'Sorriso', aliases: [':-)'] },
  { code: ':D', emoji: '😃', name: 'Riso Aberto', aliases: [':-D', ':d', ':-d'] },
  { code: ';)', emoji: '😉', name: 'Piscadinha', aliases: [';-)'] },
  { code: ':P', emoji: '😛', name: 'Língua de Fora', aliases: [':-P', ':p', ':-p'] },
  { code: '(L)', emoji: '❤️', name: 'Coração', aliases: ['(l)', '<3'] },
  { code: '(K)', emoji: '💋', name: 'Beijo', aliases: ['(k)'] },
  { code: '(U)', emoji: '💔', name: 'Coração Partido', aliases: ['(u)'] },
  { code: '(Y)', emoji: '👍', name: 'Joinha / Sim', aliases: ['(y)'] },
  { code: '(N)', emoji: '👎', name: 'Polegar Abaixo / Não', aliases: ['(n)'] },
  { code: '(6)', emoji: '😈', name: 'Diabinho', aliases: ['(devil)'] },
  { code: '(A)', emoji: '😇', name: 'Anjinho', aliases: ['(a)', '(angel)'] },
  { code: '(*)', emoji: '⭐', name: 'Estrela', aliases: ['(star)'] },
  { code: '(B)', emoji: '🍺', name: 'Cerveja', aliases: ['(b)', '(beer)'] },
  { code: '(M)', emoji: '🎵', name: 'Música', aliases: ['(m)', '(music)'] },
  { code: '(S)', emoji: '🌙', name: 'Lua Boa Noite', aliases: ['(s)'] },
  { code: '(H)', emoji: '😎', name: 'Óculos de Sol / Cool', aliases: ['(h)', '(cool)'] },
  { code: ':@', emoji: '😡', name: 'Bravo / Zangado', aliases: [':-@'] },
  { code: `:'(`, emoji: '😢', name: 'Chorando', aliases: [":'-(", ';('] },
  { code: ':-O', emoji: '😮', name: 'Surpreso', aliases: [':O', ':-o', ':o'] },
  { code: '(C)', emoji: '☕', name: 'Cafézinho', aliases: ['(c)', '(coffee)'] },
  { code: '(^)', emoji: '🎂', name: 'Bolo de Aniversário', aliases: ['(cake)'] },
  { code: '(F)', emoji: '🌹', name: 'Rosa Vermelha', aliases: ['(f)', '(rose)'] },
  { code: '(G)', emoji: '🎁', name: 'Presente', aliases: ['(g)', '(gift)'] },
  { code: '(8)', emoji: '🎶', name: 'Nota Musical', aliases: [] },
  { code: '(E)', emoji: '✉️', name: 'Carta / Recado', aliases: ['(e)', '(mail)'] },
  { code: '(I)', emoji: '💡', name: 'Ideia', aliases: ['(i)'] },
  { code: '(P)', emoji: '📷', name: 'Câmera / Foto', aliases: ['(p)'] },
];

export function parseEmoticonsToEmoji(text: string): string {
  if (!text) return '';
  let result = text;

  MSN_EMOTICONS.forEach((item) => {
    // Replace primary code
    const escapedCode = item.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedCode, 'g');
    result = result.replace(regex, item.emoji);

    // Replace aliases
    if (item.aliases) {
      item.aliases.forEach((alias) => {
        const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const aliasRegex = new RegExp(escapedAlias, 'g');
        result = result.replace(aliasRegex, item.emoji);
      });
    }
  });

  return result;
}

export function assignUserColor(userId: string): string {
  const colors = [
    '#0284c7', // Sky blue
    '#16a34a', // Emerald green
    '#9333ea', // Purple
    '#ea580c', // Orange
    '#db2777', // Pink
    '#06b6d4', // Cyan
    '#e11d48', // Rose
    '#4f46e5', // Indigo
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
