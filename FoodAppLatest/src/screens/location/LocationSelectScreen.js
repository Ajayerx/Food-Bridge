import React, { useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAddressStore } from "../../store/addressStore";
import { Colors } from "../../constants/colors";

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

    const addresses = useAddressStore(s => s.addresses);
    const selectedAddress = useAddressStore(s => s.selectedAddress);
    const setSelectedAddress = useAddressStore(s => s.setSelectedAddress);
    const fetchAddresses = useAddressStore(s => s.fetchAddresses);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const selectAddress = (address) => {
        setSelectedAddress(address);
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

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
                    onPress={() => navigation.navigate("AddAddressScreen")}
                    activeOpacity={0.75}
                >
                    <View style={[styles.quickIcon, { backgroundColor: "#FFF3E0" }]}>
                        <Icon name="my-location" size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.quickText}>Use Current{"\n"}Location</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.quickCard}
                    onPress={() => navigation.navigate("AddAddressScreen")}
                    activeOpacity={0.75}
                >
                    <View style={[styles.quickIcon, { backgroundColor: "#FFF3E0" }]}>
                        <Icon name="add-location-alt" size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.quickText}>Add New{"\n"}Address</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.quickCard}
                    onPress={() => navigation.navigate("AddressesScreen")}
                    activeOpacity={0.75}
                >
                    <View style={[styles.quickIcon, { backgroundColor: "#E8F5E9" }]}>
                        <Icon name="list" size={20} color="#2E7D32" />
                    </View>
                    <Text style={styles.quickText}>Manage{"\n"}Addresses</Text>
                </TouchableOpacity>
            </View>

            {/* Saved Addresses */}
            <Text style={styles.savedTitle}>SAVED ADDRESSES</Text>

            <FlatList
                data={addresses}
                // ✅ FIXED: id not _id
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
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
                                { backgroundColor: isSelected ? Colors.primaryLight : "#F5F5F5" }
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

                            {/* Selected check */}
                            {isSelected && (
                                <Icon name="check-circle" size={20} color={Colors.primary} />
                            )}
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: { padding: 4 },
    title: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },

    // Search
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 46,
        gap: 10,
        margin: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.textPrimary,
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
        backgroundColor: "#F9F9F9",
        padding: 12,
        borderRadius: 14,
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.border,
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
        color: Colors.textSecondary,
        lineHeight: 16,
    },

    // Saved Addresses
    savedTitle: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        fontSize: 11,
        fontWeight: "700",
        color: Colors.textLight,
        letterSpacing: 1,
    },
    addressCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: Colors.border,
    },
    addressCardSelected: {
        backgroundColor: "#FFFAF7",
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
        color: Colors.textPrimary,
    },
    defaultBadge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    defaultBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.primary,
    },
    addressText: {
        fontSize: 12,
        color: Colors.textSecondary,
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
        color: Colors.textSecondary,
    },
    emptyAction: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: "700",
    },
});