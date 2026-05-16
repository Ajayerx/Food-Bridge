import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAddressStore } from "../../store/addressStore";
import { Colors } from "../../constants/colors";

const LABELS = ["Home", "Work", "Other"];

export const EditAddressScreen = ({ route, navigation }) => {
    const { address } = route.params;
    const updateAddress = useAddressStore(s => s.updateAddress);

    // ✅ FIXED: correct DB field names
    const [label, setLabel] = useState(address.label || "Home");
    const [address_line1, setAddressLine1] = useState(address.address_line1 || "");
    const [address_line2, setAddressLine2] = useState(address.address_line2 || "");
    const [city, setCity] = useState(address.city || "");
    const [state, setState] = useState(address.state || "");
    const [pincode, setPincode] = useState(address.pin_code ?? address.pincode ?? "");
    const [loading, setLoading] = useState(false);

    const save = async () => {
        if (!address_line1.trim()) {
            Alert.alert("Required", "Please enter address line 1");
            return;
        }
        if (!city.trim()) {
            Alert.alert("Required", "Please enter city");
            return;
        }
        if (!state.trim()) {
            Alert.alert("Required", "Please enter state");
            return;
        }
        if (!pincode.trim() || pincode.length < 6) {
            Alert.alert("Required", "Please enter a valid 6-digit pincode");
            return;
        }

        setLoading(true);
        try {
            // ✅ FIXED: item.id not item._id, correct field names
            await updateAddress(address.id, {
                label,
                address_line1: address_line1.trim(),
                address_line2: address_line2.trim() || undefined,
                city: city.trim(),
                state: state.trim(),
                pin_code: pincode.trim(),
                latitude: address.latitude ?? 0,
                longitude: address.longitude ?? 0,
                is_default: address.is_default ?? false,
            });
            navigation.goBack();
        } catch (e) {
            Alert.alert("Error", e?.message || "Failed to update address");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back-ios" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Address</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Label Selector */}
                <Text style={styles.sectionLabel}>Address Type</Text>
                <View style={styles.labelRow}>
                    {LABELS.map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.labelBtn, label === type && styles.labelBtnActive]}
                            onPress={() => setLabel(type)}
                            activeOpacity={0.75}
                        >
                            <Icon
                                name={type === "Home" ? "home" : type === "Work" ? "work" : "location-on"}
                                size={15}
                                color={label === type ? Colors.white : Colors.textSecondary}
                            />
                            <Text style={[styles.labelBtnText, label === type && styles.labelBtnTextActive]}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Address Line 1 */}
                <Text style={styles.inputLabel}>
                    Address Line 1 <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                    style={styles.input}
                    value={address_line1}
                    onChangeText={setAddressLine1}
                    placeholder="House no / Street / Area"
                    placeholderTextColor={Colors.textLight}
                />

                {/* Address Line 2 */}
                <Text style={styles.inputLabel}>
                    Address Line 2 <Text style={styles.optional}>(optional)</Text>
                </Text>
                <TextInput
                    style={styles.input}
                    value={address_line2}
                    onChangeText={setAddressLine2}
                    placeholder="Landmark / Apartment"
                    placeholderTextColor={Colors.textLight}
                />

                <Text style={styles.inputLabel}>
                    State <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                    style={styles.input}
                    value={state}
                    onChangeText={setState}
                    placeholder="e.g. Madhya Pradesh"
                    placeholderTextColor={Colors.textLight}
                />

                {/* City & Pincode */}
                <View style={styles.rowInputs}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>
                            City <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={city}
                            onChangeText={setCity}
                            placeholder="City"
                            placeholderTextColor={Colors.textLight}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>
                            Pincode <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={pincode}
                            onChangeText={setPincode}
                            keyboardType="numeric"
                            maxLength={6}
                            placeholder="6-digit pincode"
                            placeholderTextColor={Colors.textLight}
                        />
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                    onPress={save}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading
                        ? <ActivityIndicator color={Colors.white} />
                        : <>
                            <Icon name="check" size={18} color={Colors.white} />
                            <Text style={styles.saveText}>Update Address</Text>
                        </>
                    }
                </TouchableOpacity>
            </ScrollView>
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

    scrollContent: { padding: 16, paddingBottom: 40 },

    // Label selector
    sectionLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.textSecondary,
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    labelRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    labelBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
    },
    labelBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    labelBtnText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
    labelBtnTextActive: { color: Colors.white },

    // Inputs
    inputLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    required: { color: Colors.error },
    optional: { color: Colors.textLight, fontWeight: "400" },
    input: {
        backgroundColor: Colors.white,
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.border,
        fontSize: 14,
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    rowInputs: { flexDirection: "row", gap: 12 },

    // Save Button
    saveBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 15,
        borderRadius: 14,
        marginTop: 8,
        elevation: 3,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});