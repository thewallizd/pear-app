// lib/avatarUtils.js

export const getAvatarUrl = (username, style = 'notionists') => {
  // 1. Seed adalah kunci keunikan. Kita pakai username.
  // Karena username setiap orang beda, gambarnya otomatis beda.
  const seed = username || 'anon';
  
  // 2. Kita kunci gayanya agar selalu 'notionists' (kecuali anonim nanti)
  // Walaupun database mengirim style lain, kita prioritaskan visual yang konsisten.
  const selectedStyle = 'notionists'; 
  
  // 3. Palet warna background (Dicebear akan memilih satu secara acak berdasarkan seed)
  // Ini bikin avatar makin unik (ada yang pink, biru, kuning, ungu, dll)
  const bgColors = 'c0aede,b6e3f4,ffdfbf,ffd5dc,d1d4f9,ffdfbf,c7f9cc,ffadad';

  return `https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${seed}&backgroundColor=${bgColors}&radius=50`;
};