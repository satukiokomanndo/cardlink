import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 五十音インデックス用
export const KANA_ROWS = [
  { label: 'あ', chars: ['ア', 'イ', 'ウ', 'エ', 'オ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ'] },
  { label: 'か', chars: ['カ', 'キ', 'ク', 'ケ', 'コ', 'ガ', 'ギ', 'グ', 'ゲ', 'ゴ'] },
  { label: 'さ', chars: ['サ', 'シ', 'ス', 'セ', 'ソ', 'ザ', 'ジ', 'ズ', 'ゼ', 'ゾ'] },
  { label: 'た', chars: ['タ', 'チ', 'ツ', 'テ', 'ト', 'ダ', 'ヂ', 'ヅ', 'デ', 'ド', 'ッ'] },
  { label: 'な', chars: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'] },
  { label: 'は', chars: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ', 'バ', 'ビ', 'ブ', 'ベ', 'ボ', 'パ', 'ピ', 'プ', 'ペ', 'ポ'] },
  { label: 'ま', chars: ['マ', 'ミ', 'ム', 'メ', 'モ'] },
  { label: 'や', chars: ['ヤ', 'ユ', 'ヨ', 'ャ', 'ュ', 'ョ'] },
  { label: 'ら', chars: ['ラ', 'リ', 'ル', 'レ', 'ロ'] },
  { label: 'わ', chars: ['ワ', 'ヲ', 'ン', 'ヴ'] },
  { label: 'A-Z', chars: [] }, // 英字
]

export function getKanaRow(kana: string): string {
  if (!kana) return 'その他'
  const firstChar = kana.charAt(0).toUpperCase()

  // 英字チェック
  if (/[A-Za-z]/.test(firstChar)) return 'A-Z'

  for (const row of KANA_ROWS) {
    if (row.chars.includes(firstChar)) return row.label
  }
  return 'その他'
}

// ひらがな→カタカナ変換
export function hiraganaToKatakana(str: string): string {
  return str.replace(/[ぁ-ゖ]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) + 0x60)
  )
}

// カタカナ→ひらがな変換
export function katakanaToHiragana(str: string): string {
  return str.replace(/[ァ-ヶ]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) - 0x60)
  )
}

// 名刺のふりがな比較用正規化
export function normalizeKana(str: string): string {
  if (!str) return ''
  return hiraganaToKatakana(str.trim().toUpperCase())
}

// 日付フォーマット
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// ファイルサイズフォーマット
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// URLバリデーション
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// 電話番号フォーマット
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}
