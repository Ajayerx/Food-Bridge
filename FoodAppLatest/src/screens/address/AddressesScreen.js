import React, { useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useAddressStore } from "../../store/addressStore";
import { Colors } from "../../constants/colors";

const LABEL_ICONS = {
    Home: { icon: "home", color: "#FF6B35", bg: "#FFF3E0" },
    Work: { icon: "work", color: "#1565C0", bg: "#E3F2FD" },
    Other: { icon: "location-on", color: "#6A1B9A", bg: "#F3E5F5" },
};

const AddressCard = ({ item, onEdit, onDelete, onSetDefault }) => {
    const config = LABEL_ICONS[item.label] || LABEL_ICONS.Other;

    return (
        <View style={[styles.card, item.is_default && styles.cardDefault]}>
            {/* Default badge */}
            {!!item.is_default && (
                <View style={styles.defaultBadge}>
                    <Icon name="check-circle" size={11} color={Colors.primary} />
                    <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
            )}

            <View style={styles.cardRow}>
                {/* Icon */}
                <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
                    <Icon name={config.icon} size={22} color={config.color} />
                </View>

                {/* Address info */}
                <View style={styles.addressContent}>
                    <Text style={styles.labelText}>{item.label}</Text>

                    {/* ✅ FIXED: address_line1 not item.address */}
                    <Text style={styles.addressLine} numberOfLines={2}>
                        {item.address_line1}
                        {item.address_line2 ? `, ${item.address_line2}` : ""}
                    </Text>

                    {/* ✅ FIXED: city + pincode only — no state (not in DB) */}
                    <Text style={styles.cityLine}>
                        {item.city}{item.pin_code ? ` — ${item.pin_code}` : ""}
                    </Text>

                </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
                {!item.is_default && (
                    <TouchableOpacity
                        style={styles.defaultBtn}
                        onPress={() => onSetDefault(item.id)}
                        activeOpacity={0.75}
                    >
                        <Icon name="radio-button-unchecked" size={14} color={Colors.primary} />
                        <Text style={styles.defaultBtnText}>Set Default</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.actionRight}>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => onEdit(item)}
                        activeOpacity={0.75}
                    >
                        <Icon name="edit" size={14} color={Colors.primary} />
                        <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => onDelete(item.id)}  // ✅ FIXED: item.id not item._id
                        activeOpacity={0.75}
                    >
                        <Icon name="delete-outline" size={14} color="#E53935" />
                        <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export const AddressesScreen = ({ navigation }) => {
    const addresses = useAddressStore(s => s.addresses);
    const fetchAddresses = useAddressStore(s => s.fetchAddresses);
    const removeAddress = useAddressStore(s => s.removeAddress);
    const makeDefault = useAddressStore(s => s.makeDefault);

    // ✅ Refetch every time screen comes into focus (handles back navigation)
    useFocusEffect(
        React.useCallback(() => {
            fetchAddresses();
        }, [])
    );

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Address",
            "Are you sure you want to delete this address?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => removeAddress(id),
                },
            ]
        );
    };

    const handleEdit = (item) => {
        navigation.navigate("EditAddressScreen", { address: item });
    };

    const handleSetDefault = (id) => {
        makeDefault(id);
    };

    const ListEmpty = () => (
        <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyTitle}>No saved addresses</Text>
            <Text style={styles.emptySub}>Add your home or work address for faster checkout</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back-ios" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Addresses</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Address List */}
            <FlatList
                data={addresses}
                // ✅ FIXED: id not _id
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <AddressCard
                        item={item}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onSetDefault={handleSetDefault}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={ListEmpty}
                showsVerticalScrollIndicator={false}
            />

            {/* Add New Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate("AddAddressScreen")}
                    activeOpacity={0.85}
                >
                    <Icon name="add-location-alt" size={20} color={Colors.white} />
                    <Text style={styles.addBtnText}>Add New Address</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F5F5" },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Colors.white,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        elevation: 2,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },

    // List
    listContent: { padding: 16, paddingBottom: 100, gap: 12 },

    // Card
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        borderWidth: 1.5,
        borderColor: "transparent",
    },
    cardDefault: {
        borderColor: Colors.primary,
        backgroundColor: "#FFFAF7",
    },
    defaultBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        marginBottom: 10,
    },
    defaultBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.primary },

    cardRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    addressContent: { flex: 1 },
    labelText: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
    addressLine: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 2 },
    cityLine: { fontSize: 12, color: Colors.textLight, marginTop: 2 },

    // Actions
    actions: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    actionRight: { flexDirection: "row", gap: 8, marginLeft: "auto" },
    defaultBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: Colors.primaryLight,
    },
    defaultBtnText: { fontSize: 12, fontWeight: "600", color: Colors.primary },
    editBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    editText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
    deleteBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: "#E53935",
    },
    deleteText: { fontSize: 12, fontWeight: "700", color: "#E53935" },

    // Empty
    emptyBox: { alignItems: "center", paddingVertical: 60, gap: 10 },
    emptyEmoji: { fontSize: 52 },
    emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
    emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 32 },

    // Footer
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        elevation: 10,
    },
    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 15,
        borderRadius: 14,
    },
    addBtnText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});