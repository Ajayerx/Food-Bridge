import api from "../lib/apiClient";
import type { MenuCategory, MenuItem, ItemVariant, ModifierGroup, ModifierOption, CreateModifierGroupRequest, CreateModifierOptionRequest, ApiResponse } from "types";

// ── Normalisers ───────────────────────────────────────────────────────────────
// Philosophy: pass DB values through as-is. No case transforms, no remapping.
// DB is source of truth. dietary_tag = "Veg" / "Vegan" / "Non-Veg" exactly.

export function normalizeCategory(raw: any): MenuCategory {
    return {
        id: raw.id,
        restaurantId: raw.restaurant_id ?? raw.restaurantId ?? "",
        name: raw.name,
        imageUrl: raw.image_url ?? raw.imageUrl ?? null,
        sortOrder: raw.display_order ?? raw.sortOrder ?? 0,
        // MSSQL bit columns come as 0/1 — loose equality handles all variants
        isActive: raw.is_active == 1 || raw.isActive === true,
        createdAt: raw.created_at ?? raw.createdAt ?? "",
        updatedAt: raw.updated_at ?? raw.updatedAt ?? null,
        deletedAt: raw.deleted_at ?? raw.deletedAt ?? null,
        items: [],
    };
}

export function normalizeMenuItem(raw: any): MenuItem {
    const availRaw = raw.is_available ?? raw.isAvailable;
    const featuredRaw = raw.is_featured ?? raw.isFeatured;

    return {
        id: raw.id,
        categoryId: raw.category_id ?? raw.categoryId,
        restaurantId: raw.restaurant_id ?? raw.restaurantId ?? "",
        name: raw.name,
        description: raw.description ?? null,
        price: Number(raw.base_price ?? raw.price ?? 0),
        imageUrl: raw.image_url ?? raw.imageUrl ?? null,
        // Pass through exactly as stored in DB — "Veg", "Vegan", "Non-Veg"
        dietaryTag: raw.dietary_tag ?? raw.dietaryTag ?? "Veg",
        isVeg: raw.dietary_tag === "Veg" || raw.dietary_tag === "Vegan",
        // Default true when field absent (categories-only endpoint omits it)
        isAvailable: availRaw === undefined ? true : availRaw == 1 || availRaw === true,
        isFeatured: featuredRaw === undefined ? false : featuredRaw == 1 || featuredRaw === true,
        prepTimeMinutes: raw.prep_time_minutes ?? raw.prepTimeMinutes ?? null,
        sortOrder: raw.display_order ?? raw.sortOrder ?? 0,
        variants: (raw.variants ?? []).map(normalizeVariant),
    };
}

export function normalizeVariant(raw: any): ItemVariant {
    return {
        id: raw.id,
        itemId: raw.item_id ?? raw.itemId ?? raw.ItemId ?? "",
        name: raw.name,
        price: Number(raw.price ?? 0),
        isAvailable: raw.is_available == 1 || raw.is_available === true || raw.isAvailable === true,
    };
}

export const menuService = {

    // ─── Read ─────────────────────────────────────────────────────────────────

    getCategories: (restaurantId: string) =>
        api.get<ApiResponse<any[]>>(
            `/restaurants/${restaurantId}/menu/categories`
        ),

    getItems: (restaurantId: string) =>
        api.get<ApiResponse<any[]>>(
            `/restaurants/${restaurantId}/menu/items`
        ),

    getMenuItemById: (restaurantId: string, itemId: string) =>
        api.get<ApiResponse<any>>(
            `/restaurants/${restaurantId}/menu/items/${itemId}`
        ),

    // ─── Categories ───────────────────────────────────────────────────────────

    createCategory: (
        restaurantId: string,
        data: { name: string; sortOrder?: number; imageUrl?: string | null }
    ) =>
        api.post<ApiResponse<any>>(
            `/restaurants/${restaurantId}/menu/categories`,
            {
                name: data.name,
                image_url: data.imageUrl ?? null,
                display_order: data.sortOrder ?? 0,
                is_active: true,
            }
        ),

    updateCategory: (
        restaurantId: string,
        categoryId: string,
        data: {
            name?: string;
            sortOrder?: number;
            imageUrl?: string | null;
            isActive?: boolean;
        }
    ) =>
        api.put<ApiResponse<any>>(
            `/restaurants/${restaurantId}/menu/categories/${categoryId}`,
            {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.imageUrl !== undefined && { image_url: data.imageUrl }),
                ...(data.sortOrder !== undefined && { display_order: data.sortOrder }),
                ...(data.isActive !== undefined && { is_active: data.isActive }),
            }
        ),

    deleteCategory: (restaurantId: string, categoryId: string) =>
        api.delete<ApiResponse<void>>(
            `/restaurants/${restaurantId}/menu/categories/${categoryId}`
        ),

    // ─── Items ────────────────────────────────────────────────────────────────

    createMenuItem: (
        restaurantId: string,
        data: {
            categoryId: string;
            name: string;
            description?: string | null;
            price: number;
            imageUrl?: string | null;
            dietaryTag?: string;
            isFeatured?: boolean;
            prepTimeMinutes?: number | null;
        }
    ) =>
        api.post<ApiResponse<any>>(
            `/restaurants/${restaurantId}/menu/items`,
            {
                category_id: data.categoryId,
                name: data.name,
                description: data.description ?? null,
                base_price: data.price,
                image_url: data.imageUrl ?? null,
                dietary_tag: data.dietaryTag ?? "Veg",
                is_featured: data.isFeatured ?? false,
                prep_time_minutes: data.prepTimeMinutes ?? null,
            }
        ),

    updateMenuItem: (
        restaurantId: string,
        itemId: string,
        data: {
            name?: string;
            description?: string | null;
            price?: number;
            imageUrl?: string | null;
            dietaryTag?: string;
            isAvailable?: boolean;
            isFeatured?: boolean;
            prepTimeMinutes?: number | null;
        }
    ) =>
        api.put<ApiResponse<any>>(
            `/restaurants/${restaurantId}/menu/items/${itemId}`,
            {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.price !== undefined && { base_price: data.price }),
                ...(data.imageUrl !== undefined && { image_url: data.imageUrl }),
                ...(data.dietaryTag !== undefined && { dietary_tag: data.dietaryTag }),
                ...(data.isAvailable !== undefined && { is_available: data.isAvailable }),
                ...(data.isFeatured !== undefined && { is_featured: data.isFeatured }),
                ...(data.prepTimeMinutes !== undefined && { prep_time_minutes: data.prepTimeMinutes }),
            }
        ),

    toggleItemAvailability: (
        restaurantId: string,
        itemId: string,
        isAvailable: boolean
    ) =>
        api.put<ApiResponse<any>>(
            `/restaurants/${restaurantId}/menu/items/${itemId}`,
            { is_available: isAvailable }
        ),

    deleteMenuItem: (restaurantId: string, itemId: string) =>
        api.delete<ApiResponse<void>>(
            `/restaurants/${restaurantId}/menu/items/${itemId}`
        ),

    // ─── Variants ─────────────────────────────────────────────────────────────

    createVariant: (
        restaurantId: string,
        itemId: string,
        data: { name: string; price: number }
    ) =>
        api.post<ApiResponse<any>>(
            `/restaurants/${restaurantId}/menu/items/${itemId}/variants`,
            { name: data.name, price: data.price }
        ),

    updateVariant: (
        restaurantId: string,
        itemId: string,
        variantId: string,
        data: { name: string; price: number }
    ) =>
        api.put<ApiResponse<any>>(
            `/restaurants/${restaurantId}/menu/items/${itemId}/variants/${variantId}`,
            { name: data.name, price: data.price }
        ),

    deleteVariant: (
        restaurantId: string,
        itemId: string,
        variantId: string
    ) =>
        api.delete<ApiResponse<void>>(
            `/restaurants/${restaurantId}/menu/items/${itemId}/variants/${variantId}`
        ),

    // ─── Modifier Groups ───────────────────────────────────────────────────────

    createModifierGroup: (
        restaurantId: string,
        itemId: string,
        data: CreateModifierGroupRequest
    ) =>
        api.post<ApiResponse<ModifierGroup>>(
            `/restaurants/${restaurantId}/menu/items/${itemId}/modifier-groups`,
            {
                name: data.name,
                isRequired: data.isRequired ?? false,
                maxSelections: data.maxSelections ?? 1,
            }
        ),

    deleteModifierGroup: (
        restaurantId: string,
        itemId: string,
        groupId: string
    ) =>
        api.delete<ApiResponse<void>>(
            `/restaurants/${restaurantId}/menu/items/${itemId}/modifier-groups/${groupId}`
        ),

    createModifierOption: (
        restaurantId: string,
        itemId: string,
        groupId: string,
        data: CreateModifierOptionRequest
    ) =>
        api.post<ApiResponse<ModifierOption>>(
            `/restaurants/${restaurantId}/menu/items/${itemId}/modifier-groups/${groupId}/options`,
            {
                name: data.name,
                additionalPrice: data.additionalPrice ?? 0,
            }
        ),
};