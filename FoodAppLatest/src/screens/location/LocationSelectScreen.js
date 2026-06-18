import React, { useState, useEffect, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    StatusBar,
    Share,
    Alert,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAddressStore } from "../../store/addressStore";
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';

const LABEL_ICON = {
    Home: "home",
    Work: "work",
    Other: "location-on",
};

const LABEL_COLOR = {
    Home: "#FF6B35",
    Work: "#1565C0",
    Other: "#6A1B9A",
};

export const LocationSelectScreen = ({ navigation }) => {
    const Colors = useTheme();
    const darkMode = useUserStore(s => s.darkMode);
    const styles = useMemo(() => createStyles(Colors), [Colors]);

    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

    const addresses = useAddressStore(s => s.addresses);
    const selectedAddress = useAddressStore(s => s.selectedAddress);
    const setSelectedAddress = useAddressStore(s => s.setSelectedAddress);
    const fetchAddresses = useAddressStore(s => s.fetchAddresses);
    const removeAddress = useAddressStore(s => s.removeAddress);

    // Selected address first, then the rest
    const sortedAddresses = useMemo(() => {
        if (!selectedAddress) return addresses;
        const idx = addresses.findIndex(a => a.id === selectedAddress.id);
        if (idx < 0) return addresses;
        const copy = [...addresses];
        const [selected] = copy.splice(idx, 1);
        return [selected, ...copy];
    }, [addresses, selectedAddress]);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const selectAddress = (address) => {
        setSelectedAddress(address);
        navigation.goBack();
    };

    const handleShare = (item) => {
        const addressText = [item.address_line1, item.address_line2, item.city, item.state, item.pincode]
            .filter(Boolean)
            .join(', ');
        Share.share({ message: `${item.label}: ${addressText}` });
        setOpenMenuId(null);
    };

    const handleDelete = (item) => {
        setOpenMenuId(null);
        Alert.alert(
            'Delete Address',
            `Are you sure you want to delete "${item.label}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await removeAddress(item.id);
                        await fetchAddresses();
                    },
                },
            ]
        );
    };

    const handleEdit = (item) => {
        setOpenMenuId(null);
        navigation.navigate('LocationPickerScreen', {
            existingAddress: item,
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar backgroundColor={Colors.surface} barStyle={darkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back-ios" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Select Your Location</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
                <Icon name="search" size={20} color={Colors.textLight} />
                <TextInput
                    placeholder="Search an area or address"
                    placeholderTextColor={Colors.textLight}
                    style={styles.searchInput}
                />
            </View>

            {/* Quick Options */}
            <View style={styles.quickRow}>
                <TouchableOpacity
                    style={styles.quickCard}
                    onPress={() => navigation.navigate("LocationPickerScreen", {})}
                    activeOpacity={0.75}
                >
                    <View style={[styles.quickIcon, { backgroundColor: Colors.primaryLight }]}>
                        <Icon name="my-location" size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.quickText}>Use Current{"\n"}Location</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.quickCard}
                    onPress={() => navigation.navigate("LocationPickerScreen", {})}
                    activeOpacity={0.75}
                >
                    <View style={[styles.quickIcon, { backgroundColor: Colors.primaryLight }]}>
                        <Icon name="add-location-alt" size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.quickText}>Add New{"\n"}Address</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.quickCard}
                    onPress={() => navigation.navigate("AddressesScreen")}
                    activeOpacity={0.75}
                >
                    <View style={[styles.quickIcon, { backgroundColor: Colors.secondaryLight }]}>
                        <Icon name="list" size={20} color={Colors.secondary} />
                    </View>
                    <Text style={styles.quickText}>Manage{"\n"}Addresses</Text>
                </TouchableOpacity>
            </View>

            {/* Saved Addresses */}
            <Text style={styles.savedTitle}>SAVED ADDRESSES</Text>

            <FlatList
                data={sortedAddresses}
                // ✅ FIXED: id not _id
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                onScroll={() => setOpenMenuId(null)}
                scrollEventThrottle={16}
                renderItem={({ item }) => {
                    const isSelected = selectedAddress?.id === item.id;
                    const iconName = LABEL_ICON[item.label] || "location-on";
                    const iconColor = LABEL_COLOR[item.label] || Colors.primary;

                    return (
                        <TouchableOpacity
                            style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                            onPress={() => selectAddress(item)}
                            activeOpacity={0.75}
                        >
                            {/* Icon */}
                            <View style={[
                                styles.addressIconBox,
                                { backgroundColor: isSelected ? Colors.primaryLight : Colors.background }
                            ]}>
                                <Icon name={iconName} size={20} color={isSelected ? Colors.primary : iconColor} />
                            </View>

                            {/* Text */}
                            <View style={{ flex: 1 }}>
                                <View style={styles.addressTopRow}>
                                    <Text style={styles.addressLabel}>{item.label}</Text>
                                    {!!item.is_default && (
                                        <View style={styles.defaultBadge}>
                                            <Text style={styles.defaultBadgeText}>Default</Text>
                                        </View>
                                    )}
                                </View>
                                {/* ✅ FIXED: address_line1 not item.address */}
                                <Text style={styles.addressText} numberOfLines={1}>
                                    {[item.address_line1, item.city, item.pincode]
                                        .filter(Boolean)
                                        .join(", ")}
                                </Text>
                            </View>

                            {/* Right side: checkmark + 3-dot */}
                            <View style={styles.cardRight}>
                                {isSelected && (
                                    <Icon name="check-circle" size={20} color={Colors.primary} />
                                )}
                                <TouchableOpacity
                                    onPress={(e) => {
                                        if (openMenuId === item.id) {
                                            setOpenMenuId(null);
                                            return;
                                        }
                                        e.currentTarget.measure((fx, fy, width, height, px, py) => {
                                            setMenuPosition({ top: py - 10, right: 16 });
                                            setOpenMenuId(item.id);
                                        });
                                    }}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    style={styles.dotBtn}
                                >
                                    <Icon name="more-vert" size={20} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyEmoji}>📍</Text>
                        <Text style={styles.emptyText}>No saved addresses</Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate("AddAddressScreen")}
                        >
                            <Text style={styles.emptyAction}>+ Add your first address</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Floating popover */}
            <Modal
                visible={openMenuId !== null}
                transparent
                animationType="none"
                onRequestClose={() => setOpenMenuId(null)}
            >
                <TouchableOpacity
                    style={styles.popoverOverlay}
                    activeOpacity={1}
                    onPress={() => setOpenMenuId(null)}
                >
                    <View style={[styles.popover, { top: menuPosition.top, right: menuPosition.right }]}>
                        <TouchableOpacity
                            style={styles.popoverItem}
                            onPress={() => {
                                const item = addresses.find(a => a.id === openMenuId);
                                if (item) handleEdit(item);
                            }}
                        >
                            <Icon name="edit" size={16} color="#FFFFFF" />
                            <Text style={styles.popoverText}>Edit</Text>
                        </TouchableOpacity>
                        <View style={styles.popoverDivider} />
                        <TouchableOpacity
                            style={styles.popoverItem}
                            onPress={() => {
                                const item = addresses.find(a => a.id === openMenuId);
                                if (item) handleShare(item);
                            }}
                        >
                            <Icon name="share" size={16} color="#FFFFFF" />
                            <Text style={styles.popoverText}>Share</Text>
                        </TouchableOpacity>
                        <View style={styles.popoverDivider} />
                        <TouchableOpacity
                            style={styles.popoverItem}
                            onPress={() => {
                                const item = addresses.find(a => a.id === openMenuId);
                                if (item) handleDelete(item);
                            }}
                        >
                            <Icon name="delete-outline" size={16} color="#FF453A" />
                            <Text style={[styles.popoverText, { color: '#FF453A' }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const createStyles = (C) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.surface },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    backBtn: { padding: 4 },
    title: { fontSize: 18, fontWeight: "800", color: C.textPrimary },

    // Search
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.background,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 46,
        gap: 10,
        margin: 16,
        borderWidth: 1,
        borderColor: C.border,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: C.textPrimary,
    },

    // Quick Options
    quickRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginBottom: 20,
        gap: 10,
    },
    quickCard: {
        flex: 1,
        backgroundColor: C.surface,
        padding: 12,
        borderRadius: 14,
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: C.border,
    },
    quickIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    quickText: {
        textAlign: "center",
        fontSize: 11,
        fontWeight: "600",
        color: C.textSecondary,
        lineHeight: 16,
    },

    // Saved Addresses
    savedTitle: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        fontSize: 11,
        fontWeight: "700",
        color: C.textLight,
        letterSpacing: 1,
    },
    addressCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: C.border,
    },
    addressCardSelected: {
        backgroundColor: C.primaryLight,
    },
    addressIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    addressTopRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 2,
    },
    addressLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: C.textPrimary,
    },
    defaultBadge: {
        backgroundColor: C.primaryLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    defaultBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: C.primary,
    },
    addressText: {
        fontSize: 12,
        color: C.textSecondary,
    },
    cardRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dotBtn: {
        padding: 4,
    },
    // Popover
    popoverOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    popover: {
        position: 'absolute',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        width: 150,
        paddingVertical: 4,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    popoverItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    popoverText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    popoverDivider: {
        height: 0.5,
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginHorizontal: 12,
    },

    // Empty
    emptyBox: {
        alignItems: "center",
        paddingVertical: 40,
        gap: 8,
    },
    emptyEmoji: { fontSize: 40 },
    emptyText: {
        fontSize: 15,
        fontWeight: "600",
        color: C.textSecondary,
    },
    emptyAction: {
        fontSize: 13,
        color: C.primary,
        fontWeight: "700",
    },
});