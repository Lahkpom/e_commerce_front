import type { ProductCategory, TargetGender } from '../constants/products';

export type RowStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export interface ColorResponse {
  id: number;
  name: string;
  desc: string;
  code: string;
  rowStatus: RowStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface ColorRequest {
  name: string;
  desc: string;
  code: string;
}

export interface AdminProductResponse {
  id: string;
  category: ProductCategory;
  targetGender: TargetGender;
  name: string;
  shortDesc: string;
  longDesc: string;
  status: RowStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  targetGender: TargetGender;
  rowStatus: RowStatus;
}

export interface AdminProductSearchFilters {
  targetGender?: TargetGender;
  rowStatus?: Exclude<RowStatus, 'DELETED'>;
  search?: string;
  page?: number;
  size?: number;
}

export interface AdminProductRequest {
  targetGender: TargetGender;
  name: string;
  shortDesc: string;
  longDesc: string;
}

export interface AdminVariantResponse {
  id: number;
  productId: string;
  productName: string;
  colorId: number;
  colorName: string;
  colorCode: string;
  size: NumericSize;
  desc: string;
  sku: string;
  price: number;
  stock: number;
  rowStatus: RowStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface VariantCreateRequest {
  productId: string;
  colorId: number;
  size: NumericSize;
  desc: string;
  sku: string;
  price: number;
  stock: number;
}

export interface VariantUpdateRequest {
  colorId: number;
  size: NumericSize;
  desc: string;
  sku: string;
  price: number;
  stock: number;
}

export interface AdminVariantSearchFilters {
  productId?: string;
  colorId?: number;
  size?: NumericSize;
  rowStatus?: Exclude<RowStatus, 'DELETED'>;
  search?: string;
  page?: number;
}

export interface ProductCatalogImage {
  colorId: number | null;
  colorName: string | null;
  colorCode: string | null;
  imageUrl: string | null;
}

export interface ProductCatalogItem {
  id: string;
  category: ProductCategory;
  targetGender: TargetGender;
  name: string;
  shortDesc: string | null;
  minPrice: number | null;
  sizeCount: number | null;
  colorCount: number | null;
  mainImagesUrl: ProductCatalogImage[] | null;
}

export interface ProductDetail {
  id: string;
  name: string;
  longDesc: string;
}

export const NUMERIC_SIZES = [
  'T_18',
  'T_19',
  'T_20',
  'T_21',
  'T_22',
  'T_23',
  'T_24',
  'T_25',
  'T_26',
  'T_35',
  'T_36',
  'T_37',
  'T_38',
  'T_39',
  'T_40',
  'T_41',
  'T_42',
  'T_35_36',
  'T_37_38',
  'T_39_40',
  'T_41_42',
  'T_43_44',
  'T_45_46',
] as const;

export type NumericSize = (typeof NUMERIC_SIZES)[number];

export interface ProductVariantImage {
  imageUrl: string;
  isPrimary: boolean;
}

export interface PublicProductVariant {
  productId: string;
  variantId: number;
  size: NumericSize;
  price: number;
  stock: number;
  colorId: number;
  colorName: string;
  colorCode: string;
  images: ProductVariantImage[];
}

export interface PageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PageResponse<T> {
  content: T[];
  page: PageMetadata;
}
