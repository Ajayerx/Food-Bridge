import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { message } from "antd";
import { menuService, normalizeCategory, normalizeMenuItem } from "../services/menu.service";
import { useRestaurant } from "./useRestaurant";

export function useMenu() {
    const { restaurant } = useRestaurant();
    const rid = restaurant?.id;
    const qc = useQueryClient();

    const inv = () => qc.invalidateQueries({ queryKey: ["menu"] });

    const { data: menuData, isLoading, isError } = useQuery({
        queryKey: ["menu", rid],
        enabled: !!rid,
        queryFn: async () => {
            const [catsRes, itemsRes] = await Promise.all([
                menuService.getCategories(rid!),
                menuService.getItems(rid!),
            ]);

            const categories = (catsRes.data.data as any[]).map(normalizeCategory);
            const items = (itemsRes.data.data as any[]).map(normalizeMenuItem);

            return { categories, items };
        },
    });

    const createCategory = useMutation({
        mutationFn: (data: { name: string; sortOrder?: number; imageUrl?: string | null }) =>
            menuService.createCategory(rid!, data),
        onSuccess: () => { inv(); message.success("Category created"); },
        onError: (e: any) => message.error(e?.response?.data?.message ?? "Failed to create category"),
    });

    const updateCategory = useMutation({
        mutationFn: ({ id, data }: {
            id: string;
            data: { name?: string; sortOrder?: number; imageUrl?: string | null; isActive?: boolean };
        }) => menuService.updateCategory(rid!, id, data),
        onSuccess: () => { inv(); message.success("Category updated"); },
        onError: (e: any) => message.error(e?.response?.data?.message ?? "Failed to update category"),
    });

    const deleteCategory = useMutation({
        mutationFn: (id: string) => menuService.deleteCategory(rid!, id),
        onSuccess: () => { inv(); message.success("Category deleted"); },
        onError: (e: any) => message.error(e?.response?.data?.message ?? "Failed to delete category"),
    });

    const createMenuItem = useMutation({
        mutationFn: (data: {
            categoryId: string;
            name: string;
            description?: string | null;
            price: number;
            imageUrl?: string | null;
            dietaryTag?: string;
            isFeatured?: boolean;
            prepTimeMinutes?: number | null;
        }) => menuService.createMenuItem(rid!, data),
        onSuccess: () => { inv(); message.success("Item created"); },
        onError: (e: any) => message.error(e?.response?.data?.message ?? "Failed to create item"),
    });

    const updateMenuItem = useMutation({
        mutationFn: ({ id, data }: {
            id: string;
            data: {
                name?: string;
                description?: string | null;
                price?: number;
                imageUrl?: string | null;
                dietaryTag?: string;
                isAvailable?: boolean;
                isFeatured?: boolean;
                prepTimeMinutes?: number | null;
            };
        }) => menuService.updateMenuItem(rid!, id, data),
        onSuccess: () => { inv(); message.success("Item updated"); },
        onError: (e: any) => message.error(e?.response?.data?.message ?? "Failed to update item"),
    });

    const deleteMenuItem = useMutation({
        mutationFn: (id: string) => menuService.deleteMenuItem(rid!, id),
        onSuccess: () => { inv(); message.success("Item deleted"); },
        onError: (e: any) => message.error(e?.response?.data?.message ?? "Failed to delete item"),
    });

    const toggleItemAvailability = useMutation({
        mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
            menuService.toggleItemAvailability(rid!, id, isAvailable),
        onSuccess: () => inv(),
        onError: (e: any) => message.error(e?.response?.data?.message ?? "Failed to update availability"),
    });

    // ─── Variant mutations ────────────────────────────────────────────────────

    const createVariant = useMutation({
        mutationFn: ({ itemId, data }: { itemId: string; data: { name: string; price: number } }) =>
            menuService.createVariant(rid!, itemId, data),
        onSuccess: () => { inv(); message.success("Variant added"); },
        onError: (e: any) => message.error(e?.response?.data?.message ?? "Failed to add variant"),
    });

    const updateVariant = useMutation({
        mutationFn: ({ itemId, variantId, data }: {
            itemId: string;
            variantId: string;
            data: { name: string; price: number };
        }) => menuService.updateVariant(rid!, itemId, variantId, data),
        onSuccess: () => { inv(); message.success("Variant updated"); },
        onError: (e: any) => message.error(e?.response?.data?.message ?? "Failed to update variant"),
    });

    const deleteVariant = useMutation({
        mutationFn: ({ itemId, variantId }: { itemId: string; variantId: string }) =>
            menuService.deleteVariant(rid!, itemId, variantId),
        onSuccess: () => { inv(); message.success("Variant deleted"); },
        onError: (e: any) => message.error(e?.response?.data?.message ?? "Failed to delete variant"),
    });

    return {
        categories: menuData?.categories ?? [],
        items: menuData?.items ?? [],
        isLoading,
        isError,
        createCategory,
        updateCategory,
        deleteCategory,
        createMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleItemAvailability,
        createVariant,
        updateVariant,
        deleteVariant,
    };
}