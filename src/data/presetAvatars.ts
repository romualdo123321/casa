export interface AvatarPreset {
  id: string;
  name: string;
  category: 'msn_classic' | 'dicebear' | 'animals' | 'pixel';
  url: string;
}

export const PRESET_AVATARS: AvatarPreset[] = [
  // MSN Clássico
  {
    id: 'msn-butterfly',
    name: 'Borboleta MSN',
    category: 'msn_classic',
    url: 'https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd?w=200&h=200&fit=crop&crop=faces&q=80',
  },
  {
    id: 'msn-duck',
    name: 'Patinho de Borracha',
    category: 'msn_classic',
    url: 'https://images.unsplash.com/photo-1579613832125-5d34a13ffe0a?w=200&h=200&fit=crop&crop=faces&q=80',
  },
  {
    id: 'msn-soccer',
    name: 'Bola de Futebol',
    category: 'msn_classic',
    url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&h=200&fit=crop&crop=faces&q=80',
  },
  {
    id: 'msn-rose',
    name: 'Rosa Vermelha',
    category: 'msn_classic',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&h=200&fit=crop&crop=faces&q=80',
  },
  {
    id: 'msn-guitar',
    name: 'Guitarra Rock',
    category: 'msn_classic',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop&crop=faces&q=80',
  },
  {
    id: 'msn-skater',
    name: 'Skate Rad',
    category: 'msn_classic',
    url: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=200&h=200&fit=crop&crop=faces&q=80',
  },
  {
    id: 'msn-sunset',
    name: 'Praia Tropical',
    category: 'msn_classic',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop&crop=faces&q=80',
  },
  {
    id: 'msn-headphones',
    name: 'Fone de Ouvido DJ',
    category: 'msn_classic',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop&crop=faces&q=80',
  },

  // Animais Fofos
  {
    id: 'animal-cat',
    name: 'Gatinho Curioso',
    category: 'animals',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop&crop=faces&q=80',
  },
  {
    id: 'animal-dog',
    name: 'Cachorrinho Carismático',
    category: 'animals',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop&crop=faces&q=80',
  },
  {
    id: 'animal-panda',
    name: 'Panda Zen',
    category: 'animals',
    url: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=200&h=200&fit=crop&crop=faces&q=80',
  },
  {
    id: 'animal-fox',
    name: 'Raposinha Esperta',
    category: 'animals',
    url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=200&h=200&fit=crop&crop=faces&q=80',
  },

  // Dicebear Avatars
  {
    id: 'dicebear-alex',
    name: 'Avatar Alex',
    category: 'dicebear',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex',
  },
  {
    id: 'dicebear-maya',
    name: 'Avatar Maya',
    category: 'dicebear',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Maya',
  },
  {
    id: 'dicebear-sam',
    name: 'Avatar Sam',
    category: 'dicebear',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sam',
  },
  {
    id: 'dicebear-lucas',
    name: 'Avatar Lucas',
    category: 'dicebear',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lucas',
  },
  {
    id: 'dicebear-bot',
    name: 'Robozinho Gamer',
    category: 'dicebear',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=RetroBot',
  },
  {
    id: 'dicebear-pixel',
    name: 'Pixel Hero',
    category: 'dicebear',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=RetroPlayer',
  },
];

export const CLASSIC_COLORS = [
  { name: 'Azul MSN', color: '#0284c7', bg: 'bg-sky-600' },
  { name: 'Verde Messenger', color: '#16a34a', bg: 'bg-emerald-600' },
  { name: 'Roxo Estiloso', color: '#9333ea', bg: 'bg-purple-600' },
  { name: 'Laranja Radiante', color: '#ea580c', bg: 'bg-orange-600' },
  { name: 'Rosa Chiclete', color: '#db2777', bg: 'bg-pink-600' },
  { name: 'Vermelho Fogo', color: '#dc2626', bg: 'bg-red-600' },
  { name: 'Amarelo Ouro', color: '#d97706', bg: 'bg-amber-600' },
  { name: 'Esmeralda', color: '#059669', bg: 'bg-emerald-700' },
  { name: 'Índigo Profundo', color: '#4f46e5', bg: 'bg-indigo-600' },
  { name: 'Grafite Clássico', color: '#334155', bg: 'bg-slate-700' },
  { name: 'Chocolate Quente', color: '#854d0e', bg: 'bg-yellow-800' },
  { name: 'Prata Metálica', color: '#94a3b8', bg: 'bg-slate-400' },
];

export const NEON_COLORS = [
  { name: 'Ciano Neon', color: '#00f0ff', bg: 'bg-[#00f0ff]' },
  { name: 'Rosa Neon', color: '#ff007f', bg: 'bg-[#ff007f]' },
  { name: 'Verde Limão Neon', color: '#39ff14', bg: 'bg-[#39ff14]' },
  { name: 'Amarelo Neon', color: '#fffb00', bg: 'bg-[#fffb00]' },
  { name: 'Roxo Neon', color: '#bf00ff', bg: 'bg-[#bf00ff]' },
  { name: 'Laranja Neon', color: '#ff5f00', bg: 'bg-[#ff5f00]' },
  { name: 'Azul Elétrico', color: '#0088ff', bg: 'bg-[#0088ff]' },
  { name: 'Vermelho Neon', color: '#ff073a', bg: 'bg-[#ff073a]' },
];

export const MSN_COLORS = [...CLASSIC_COLORS, ...NEON_COLORS];

/**
 * Utility to compress and resize an uploaded image file on the client
 * to a square avatar data URL (max 256x256, JPEG/PNG)
 */
export async function compressAndFormatAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Center crop calculation (square crop)
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

        // Convert to optimized JPEG or PNG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Falha ao carregar a imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a random avatar URL using Dicebear
 */
export function generateRandomAvatar(nick?: string): string {
  const seed = nick ? encodeURIComponent(nick) : Math.random().toString(36).substring(2, 9);
  const styles = ['adventurer', 'bottts', 'micah', 'pixel-art', 'fun-emoji', 'lorelei'];
  const style = styles[Math.floor(Math.random() * styles.length)];
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}
