import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    StatusBar,
} from "react-native";
import { useAddressStore } from "../../store/addressStore";
import { Colors } from "../../constants/colors";
import Icon from "react-native-vector-icons/MaterialIcons";

const LABEL_ICONS = {
    Home: "home",
    Work: "work",
    Other: "location-on",
};

export const AddAddressScreen = ({ navigation }) => {

    const addNewAddress = useAddressStore(s => s.addNewAddress);

    const [label, setLabel] = useState("Home");
    const [address_line1, setAddressLine1] = useState("");
    const [address_line2, setAddressLine2] = useState("");
    const [city, setCity] = useState("");
    const [pincode, setPincode] = useState("");
    const [state, setState] = useState("");
    const [is_default, setIsDefault] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {

        if (!address_line1.trim()) {
            Alert.alert("Required", "Please enter your address");
            return;
        }
        if (!city.trim()) {
            Alert.alert("Required", "Please enter your city");
            return;
        }
        if (!pincode.trim() || pincode.length < 6) {
            Alert.alert("Required", "Please enter a valid 6-digit pincode");
            return;
        }
        if (!state.trim()) {
            Alert.alert("Required", "Please enter your state");
            return;
        }

        setLoading(true);

        try {
            await addNewAddress({
                label,
                address_line1: address_line1.trim(),
                address_line2: address_line2.trim() || undefined,
                city: city.trim(),
                state: state.trim(),
                pin_code: pincode.trim(),
                latitude: 22.7196,
                longitude: 75.8577,
                is_default,
            });

            Alert.alert("Success", "Address saved successfully", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);

        } catch (e) {
            Alert.alert("Error", "Failed to save address. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back-ios" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Address</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Address Type */}
                <Text style={styles.sectionTitle}>Address Type</Text>
                <View style={styles.labelRow}>
                    {["Home", "Work", "Other"].map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.labelBtn, label === type && styles.labelSelected]}
                            onPress={() => setLabel(type)}
                        >
                            <Icon
                                name={LABEL_ICONS[type]}
                                size={16}
                                color={label === type ? Colors.white : Colors.textSecondary}
                            />
                            <Text style={[styles.labelText, label === type && styles.labelTextSelected]}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Address Line 1 */}
                <Text style={styles.inputLabel}>Address Line 1 <Text style={styles.required}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={address_line1}
                    onChangeText={setAddressLine1}
                    placeholder="Flat / House No / Street"
                    placeholderTextColor={Colors.textLight}
                />

                {/* Address Line 2 */}
                <Text style={styles.inputLabel}>Address Line 2 <Text style={styles.optional}>(optional)</Text></Text>
                <TextInput
                    style={styles.input}
                    value={address_line2}
                    onChangeText={setAddressLine2}
                    placeholder="Landmark / Area"
                    placeholderTextColor={Colors.textLight}
                />

                <Text style={styles.inputLabel}>State <Text style={styles.required}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={state}
                    onChangeText={setState}
                    placeholder="e.g. Madhya Pradesh"
                    placeholderTextColor={Colors.textLight}
                />

                {/* City & Pincode Row */}
                <View style={styles.row}>
                    <View style={styles.rowHalf}>
                        <Text style={styles.inputLabel}>City <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            value={city}
                            onChangeText={setCity}
                            placeholder="City"
                            placeholderTextColor={Colors.textLight}
                        />
                    </View>
                    <View style={styles.rowHalf}>
                        <Text style={styles.inputLabel}>Pincode <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            value={pincode}
                            onChangeText={setPincode}
                            placeholder="452001"
                            placeholderTextColor={Colors.textLight}
                            keyboardType="numeric"
                            maxLength={6}
                        />
                    </View>
                </View>

                {/* Set as Default */}
                <TouchableOpacity
                    style={styles.defaultRow}
                    onPress={() => setIsDefault(!is_default)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.checkbox, is_default && styles.checkboxChecked]}>
                        {is_default && <Icon name="check" size={14} color={Colors.white} />}
                    </View>
                    <View>
                        <Text style={styles.defaultLabel}>Set as default address</Text>
                        <Text style={styles.defaultSub}>This will be selected automatically at checkout</Text>
                    </View>
                </TouchableOpacity>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Icon name="check-circle" size={20} color={Colors.white} />
                    <Text style={styles.saveText}>
                        {loading ? "Saving..." : "Save Address"}
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.white,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.background,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: Colors.textPrimary,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    labelRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 24,
    },
    labelBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1.5,
        borderColor: Colors.border,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: Colors.white,
    },
    labelSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    labelText: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: "600",
    },
    labelTextSelected: {
        color: Colors.white,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.textPrimary,
        marginBottom: 6,
    },
    required: {
        color: Colors.error,
    },
    optional: {
        color: Colors.textLight,
        fontWeight: "400",
    },
    input: {
        backgroundColor: Colors.white,
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        fontSize: 14,
        color: Colors.textPrimary,
    },
    row: {
        flexDirection: "row",
        gap: 12,
    },
    rowHalf: {
        flex: 1,
    },
    defaultRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        backgroundColor: Colors.white,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 24,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.border,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 1,
    },
    checkboxChecked: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    defaultLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.textPrimary,
    },
    defaultSub: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 14,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveText: {
        color: Colors.white,
        fontWeight: "700",
        fontSize: 16,
    },
});