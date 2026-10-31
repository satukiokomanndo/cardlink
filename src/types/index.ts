export interface BusinessCard {
  id: string;
  user_id: string;
  // 基本情報
  name: string;
  name_kana?: string;
  company_name?: string;
  company_name_kana?: string;
  department?: string;
  position?: string;
  // 連絡先
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  // 住所
  postal_code?: string;
  address?: string;
  // Web
  website?: string;
  // 画像
  front_image_url?: string;
  back_image_url?: string;
  // メタデータ
  exchange_date?: string;
  memo?: string;
  is_favorite: boolean;
  tags?: string[];
  company_id?: string;
  // 履歴管理
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  name_kana?: string;
  industry?: string;
  phone?: string;
  email?: string;
  postal_code?: string;
  address?: string;
  website?: string;
  memo?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactHistory {
  id: string;
  user_id: string;
  card_id: string;
  contact_date: string;
  location?: string;
  content?: string;
  next_contact_date?: string;
  next_contact_memo?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  created_at: string;
}

export interface MyCard {
  id: string;
  user_id: string;
  name: string;
  company_name?: string;
  department?: string;
  position?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  postal_code?: string;
  address?: string;
  website?: string;
  sns_twitter?: string;
  sns_linkedin?: string;
  sns_facebook?: string;
  logo_url?: string;
  photo_url?: string;
  template_id: string;
  design_config: DesignConfig;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DesignConfig {
  template_id: string;
  background_color: string;
  text_color: string;
  accent_color: string;
  font_family: string;
  font_size: number;
  letter_spacing: number;
  show_qr: boolean;
  show_logo: boolean;
  show_photo: boolean;
  qr_position: { x: number; y: number };
  logo_position: { x: number; y: number };
  elements: CardElement[];
}

export interface CardElement {
  id: string;
  type: 'text' | 'image' | 'qr' | 'logo';
  field?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
}

export interface CardChangeHistory {
  id: string;
  card_id: string;
  user_id: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  changed_at: string;
}

export type SortOrder = 'kana' | 'company' | 'created_at' | 'exchange_date' | 'updated_at';
export type SearchField = 'all' | 'name' | 'company' | 'phone' | 'email';

export interface SearchParams {
  query: string;
  field: SearchField;
  tags: string[];
  sortOrder: SortOrder;
  isFavoriteOnly: boolean;
}
