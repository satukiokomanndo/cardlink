import jsPDF from 'jspdf'

interface CardData {
  id: string
  name: string
  name_kana?: string | null
  company_name?: string | null
  department?: string | null
  position?: string | null
  email?: string | null
  phone?: string | null
  mobile?: string | null
  fax?: string | null
  postal_code?: string | null
  address?: string | null
  website?: string | null
  front_image_url?: string | null
  back_image_url?: string | null
  exchange_date?: string | null
  memo?: string | null
}

// 日本の名刺サイズ: 91mm × 55mm
const CARD_WIDTH_MM = 91
const CARD_HEIGHT_MM = 55
const CANVAS_SCALE = 3 // 高解像度用

async function renderCardToCanvas(card: CardData): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  const dpi = 96 * CANVAS_SCALE
  canvas.width = Math.round(CARD_WIDTH_MM * dpi / 25.4)
  canvas.height = Math.round(CARD_HEIGHT_MM * dpi / 25.4)

  const ctx = canvas.getContext('2d')!
  const scale = CANVAS_SCALE * 96 / 25.4 // px per mm

  // 背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // ボーダー
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)

  // フォント設定
  ctx.fillStyle = '#111827'
  ctx.textBaseline = 'top'

  // 名前
  ctx.font = `bold ${5 * scale}px sans-serif`
  ctx.fillText(card.name, 5 * scale, 5 * scale)

  // ふりがな
  if (card.name_kana) {
    ctx.font = `${2.5 * scale}px sans-serif`
    ctx.fillStyle = '#6b7280'
    ctx.fillText(card.name_kana, 5 * scale, 12 * scale)
  }

  // 会社・役職
  let yPos = 17
  ctx.fillStyle = '#374151'
  if (card.company_name) {
    ctx.font = `bold ${3 * scale}px sans-serif`
    ctx.fillText(card.company_name, 5 * scale, yPos * scale)
    yPos += 5
  }
  if (card.position || card.department) {
    ctx.font = `${2.5 * scale}px sans-serif`
    ctx.fillStyle = '#6b7280'
    ctx.fillText([card.department, card.position].filter(Boolean).join(' '), 5 * scale, yPos * scale)
    yPos += 5
  }

  // 連絡先
  ctx.fillStyle = '#374151'
  ctx.font = `${2.5 * scale}px sans-serif`
  yPos = 32
  if (card.email) {
    ctx.fillText(`✉ ${card.email}`, 5 * scale, yPos * scale)
    yPos += 5
  }
  if (card.phone) {
    ctx.fillText(`☎ ${card.phone}`, 5 * scale, yPos * scale)
    yPos += 5
  }
  if (card.mobile && yPos < 48) {
    ctx.fillText(`📱 ${card.mobile}`, 5 * scale, yPos * scale)
    yPos += 5
  }
  if (card.address && yPos < 48) {
    const addr = (card.postal_code ? `〒${card.postal_code} ` : '') + card.address
    ctx.fillText(`📍 ${addr}`, 5 * scale, yPos * scale)
  }

  return canvas
}

export async function exportCardToPDF(card: CardData): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
  })

  if (card.front_image_url) {
    // 実際の名刺画像がある場合はそれを使用
    const img = await loadImage(card.front_image_url)
    pdf.addImage(img, 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM)
  } else {
    // テキストでレンダリング
    const canvas = await renderCardToCanvas(card)
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    pdf.addImage(imgData, 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM)
  }

  if (card.back_image_url) {
    pdf.addPage()
    const img = await loadImage(card.back_image_url)
    pdf.addImage(img, 'JPEG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM)
  }

  pdf.save(`${card.name}_名刺.pdf`)
}

export async function exportCardToImage(card: CardData, format: 'jpg' | 'png'): Promise<void> {
  let dataUrl: string

  if (card.front_image_url && format === 'jpg') {
    dataUrl = card.front_image_url
  } else {
    const canvas = await renderCardToCanvas(card)
    dataUrl = format === 'png'
      ? canvas.toDataURL('image/png')
      : canvas.toDataURL('image/jpeg', 0.95)
  }

  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${card.name}_名刺.${format}`
  a.click()
}

export async function exportMultipleCardsToPDF(cards: CardData[]): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const cardsPerRow = 2
  const cardsPerCol = 5
  const marginX = (210 - CARD_WIDTH_MM * cardsPerRow - 5) / 2
  const marginY = (297 - CARD_HEIGHT_MM * cardsPerCol - 4 * 5) / 2
  const gapX = 5
  const gapY = 5

  for (let i = 0; i < cards.length; i++) {
    const col = i % cardsPerRow
    const row = Math.floor(i / cardsPerRow) % cardsPerCol
    const page = Math.floor(i / (cardsPerRow * cardsPerCol))

    if (i > 0 && i % (cardsPerRow * cardsPerCol) === 0) {
      pdf.addPage()
    }

    const x = marginX + col * (CARD_WIDTH_MM + gapX)
    const y = marginY + row * (CARD_HEIGHT_MM + gapY)

    const card = cards[i]
    if (card.front_image_url) {
      const img = await loadImage(card.front_image_url)
      pdf.addImage(img, 'JPEG', x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM)
    } else {
      const canvas = await renderCardToCanvas(card)
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM)
    }
  }

  pdf.save('名刺一覧.pdf')
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

export function generateVCard(card: CardData): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${card.name}`,
    card.name_kana ? `SOUND;X-IRMC-N:${card.name_kana}` : '',
    card.company_name ? `ORG:${card.company_name}${card.department ? `;${card.department}` : ''}` : '',
    card.position ? `TITLE:${card.position}` : '',
    card.email ? `EMAIL:${card.email}` : '',
    card.phone ? `TEL;TYPE=WORK,VOICE:${card.phone}` : '',
    card.mobile ? `TEL;TYPE=CELL:${card.mobile}` : '',
    card.fax ? `TEL;TYPE=FAX:${card.fax}` : '',
    card.address ? `ADR;TYPE=WORK:;;${card.address}` : '',
    card.website ? `URL:${card.website}` : '',
    'END:VCARD',
  ].filter(Boolean)

  return lines.join('\r\n')
}

export function downloadVCard(card: CardData): void {
  const vcard = generateVCard(card)
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${card.name}.vcf`
  a.click()
  URL.revokeObjectURL(url)
}
