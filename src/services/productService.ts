import { apiRequest } from './api';
import type { TargetGender } from '../constants/products';
import {
    NUMERIC_SIZES,
    type NumericSize,
    type PageResponse,
    type ProductCatalogItem,
    type ProductDetail,
    type ProductVariantImage,
    type PublicProductVariant,
} from '../types/products';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const readRequiredString = (value: unknown, field: string): string => {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`La respuesta contiene un valor inválido en '${field}'.`);
    }
    return value;
};

const readString = (value: unknown, field: string): string => {
    if (typeof value !== 'string') {
        throw new Error(`La respuesta contiene un valor inválido en '${field}'.`);
    }
    return value;
};

const readPositiveInteger = (value: unknown, field: string): number => {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`La respuesta de variantes contiene un valor inválido en '${field}'.`);
    }
    return value;
};

const isNumericSize = (value: unknown): value is NumericSize =>
    typeof value === 'string' && NUMERIC_SIZES.some((size) => size === value);

const parseProductDetail = (data: unknown, requestedId: string): ProductDetail => {
    if (!isRecord(data)) {
        throw new Error('La respuesta del detalle no contiene un producto válido.');
    }

    const id = readRequiredString(data.id, 'id');
    if (id.toLowerCase() !== requestedId.toLowerCase()) {
        throw new Error('La API devolvió un producto distinto al solicitado.');
    }

    return {
        id,
        name: readRequiredString(data.name, 'name'),
        longDesc: readString(data.longDesc, 'longDesc'),
    };
};

const parseVariantImage = (data: unknown): ProductVariantImage | null => {
    if (!isRecord(data)) {
        throw new Error('La respuesta de variantes contiene una imagen inválida.');
    }

    const imageUrl = readString(data.imageUrl, 'images.imageUrl');
    if (imageUrl.trim() === '') return null;
    if (typeof data.isPrimary !== 'boolean') {
        throw new Error('La respuesta de variantes contiene un valor inválido en \'images.isPrimary\'.');
    }

    return { imageUrl, isPrimary: data.isPrimary };
};

const parsePublicProductVariant = (data: unknown, requestedProductId: string): PublicProductVariant => {
    if (!isRecord(data)) {
        throw new Error('La respuesta de variantes contiene un registro inválido.');
    }

    const productId = readRequiredString(data.productId, 'productId');
    if (productId.toLowerCase() !== requestedProductId.toLowerCase()) {
        throw new Error('La API devolvió una variante de otro producto.');
    }
    if (!isNumericSize(data.size)) {
        throw new Error('La respuesta de variantes contiene un talle no reconocido.');
    }

    const price = data.price;
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
        throw new Error('La respuesta de variantes contiene un precio inválido.');
    }

    const stock = data.stock;
    if (typeof stock !== 'number' || !Number.isSafeInteger(stock) || stock < 0) {
        throw new Error('La respuesta de variantes contiene un stock inválido.');
    }

    const colorCode = readRequiredString(data.colorCode, 'colorCode');
    if (!/^#[\da-f]{6}$/i.test(colorCode)) {
        throw new Error('La respuesta de variantes contiene un código de color inválido.');
    }

    let images: ProductVariantImage[] = [];
    if (data.images !== null && data.images !== undefined) {
        if (!Array.isArray(data.images)) {
            throw new Error('La respuesta de variantes contiene una galería inválida.');
        }
        images = data.images
            .map(parseVariantImage)
            .filter((image): image is ProductVariantImage => image !== null);
    }

    return {
        productId,
        variantId: readPositiveInteger(data.variantId, 'variantId'),
        size: data.size,
        price,
        stock,
        colorId: readPositiveInteger(data.colorId, 'colorId'),
        colorName: readRequiredString(data.colorName, 'colorName'),
        colorCode,
        images,
    };
};

export const getProductsForHomepage = async (
    targetGender: TargetGender,
    signal?: AbortSignal,
): Promise<ProductCatalogItem[]> => {
    const products: ProductCatalogItem[] = [];
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
        const params = new URLSearchParams({
            targetGender,
            page: String(page),
        });
        const response = await apiRequest<PageResponse<ProductCatalogItem>>(
            `/products?${params.toString()}`,
            { signal },
        );

        if (!response || !Array.isArray(response.content)) {
            throw new Error('La respuesta del catálogo no contiene una lista de productos válida.');
        }
        if (!Number.isInteger(response.page?.totalPages) || response.page.totalPages < 0) {
            throw new Error('La respuesta del catálogo contiene una paginación inválida.');
        }

        products.push(...response.content);
        totalPages = response.page.totalPages;
        page += 1;
    }

    return products;
};

export const getProductDetail = async (
    productId: string,
    signal?: AbortSignal,
): Promise<ProductDetail> => {
    const data = await apiRequest<unknown>(
        `/products/${encodeURIComponent(productId)}`,
        { signal },
    );
    return parseProductDetail(data, productId);
};

export const getPublicProductVariants = async (
    productId: string,
    signal?: AbortSignal,
): Promise<PublicProductVariant[]> => {
    const data = await apiRequest<unknown>(
        `/variants/public/by-product/${encodeURIComponent(productId)}`,
        { signal },
    );
    if (!Array.isArray(data)) {
        throw new Error('La respuesta de variantes no contiene una lista válida.');
    }
    return data.map((variant) => parsePublicProductVariant(variant, productId));
};
