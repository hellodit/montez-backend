// Klasifikasi sinyal komentar berbasis keyword — port dari
// bedah-akun/src/utils/reclassify-comments.js (deterministik, seperti sistem lama).

export const BUYING_KEYWORDS = [
  'harga', 'berapa', 'brp', 'price', 'how much',
  'mau beli', 'pengen beli', 'beli dimana', 'beli gimana', 'cara beli', 'where to buy',
  'mau order', 'cara order', 'pesan', 'bayar', 'order', 'cara pesen', 'cara pesan',
  'link dong', 'link nya', 'linknya', 'linkny', 'share link', 'minta link',
  'stok', 'ready', 'masih ada', 'cod', 'cod bisa',
  'shopee', 'tokped', 'tokopedia', 'lazada', 'marketplace',
  'dm dong', 'dm bang', 'pm dong', 'pm bang', 'chat dong', 'wa dong',
  'jual', 'selling', 'purchase',
]

export const FOLLOW_KEYWORDS = [
  'auto follow', 'autofollow', 'auto sub', 'autosub', 'autosubs', 'auto subs',
  'langsung follow', 'langsung sub', 'baru follow', 'baru sub', 'udah follow', 'udh follow', 'udh gue follow', 'udah gue follow',
  'follow dulu', 'follow ah', 'follow bang', 'follow lah', 'gue follow', 'gw follow', 'wajib follow', 'harus follow',
  'follow back', 'folbek', 'folback',
  'just subscribed', 'new subscriber', 'subscribe', 'subscribed', 'subs bang', 'subs dulu', 'langganan',
  'pantauin', 'mantengin', 'nunggu konten', 'nunggu upload', 'nunggu video',
  'upload mulu', 'upload terus', 'rajin upload', 'sering upload',
  'konten begini terus', 'more like this', 'konten kaya gini terus', 'bikin lagi',
  'gak akan skip', 'ga akan skip', 'gak bakal skip', 'ga bakal skip', 'wajib pantau',
  'akun wajib follow', 'akun favorit', 'channel favorit', 'kreator favorit',
]

export const DESIRE_KEYWORDS = [
  'pengen', 'pengin', 'mau nyoba', 'pengen coba', 'pengen punya', 'pengen bisa', 'pengen jadi',
  'mau kayak', 'mau seperti', 'mau gitu', 'want to', 'need more', 'please make',
  'mau tau', 'mau tahu', 'gimana caranya', 'cara nya gimana', 'how to', 'caranya',
  'tutorial dong', 'tutorialnya', 'ajarin', 'ajarin dong', 'kasih tau dong', 'kasih tau',
  'tips dong', 'share tips', 'next video', 'request dong',
  'part 2', 'part dua', 'bagian 2', 'episode 2', 'next part', 'lanjutin', 'lanjutkan',
  'lanjut dong', 'bikin lagi', 'bahas lagi', 'ceritain lagi',
  'lebih detail', 'penjelasan', 'bahas lebih', 'detail nya',
  'share ilmu', 'bagi ilmu', 'ilmunya', 'resep nya', 'resepnya',
  'coach dong', 'mentor dong', 'bimbing dong',
]

export type CommentSignals = { buying: boolean; follow: boolean; desire: boolean }

export function classifyComment(text: string): CommentSignals {
  const lower = (text || '').toLowerCase()
  return {
    buying: BUYING_KEYWORDS.some((k) => lower.includes(k)),
    follow: FOLLOW_KEYWORDS.some((k) => lower.includes(k)),
    desire: DESIRE_KEYWORDS.some((k) => lower.includes(k)),
  }
}

export function countSignals(texts: string[]): { buying: number; follow: number; desire: number } {
  let buying = 0
  let follow = 0
  let desire = 0
  for (const t of texts) {
    const s = classifyComment(t)
    if (s.buying) buying++
    if (s.follow) follow++
    if (s.desire) desire++
  }
  return { buying, follow, desire }
}
