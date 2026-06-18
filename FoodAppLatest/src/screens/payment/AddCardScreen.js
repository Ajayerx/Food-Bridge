import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import axios from "axios";
import { useTheme } from "../../hooks/useTheme";

const AddCardScreen = ({ navigation }) => {

    const Colors = useTheme();
    const styles = useMemo(() => createStyles(Colors), [Colors]);

    const [cardNumber, setCardNumber] = useState("");
    const [cardName, setCardName] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [brand, setBrand] = useState("");

    /* ---------------- Luhn Validation ---------------- */

    const validateCard = (number) => {

        let arr = (number + '')
            .split('')
            .reverse()
            .map(x => parseInt(x));

        let sum = arr.reduce((acc, val, i) => {
            if (i % 2 !== 0) {
                val *= 2;
                if (val > 9) val -= 9;
            }
            return acc + val;
        }, 0);

        return sum % 10 === 0;
    };

    /* ---------------- Detect Card Brand ---------------- */

    const detectBrand = (number) => {

        if (/^4/.test(number)) return "Visa";
        if (/^5[1-5]/.test(number)) return "MasterCard";
        if (/^3[47]/.test(number)) return "Amex";
        if (/^6/.test(number)) return "RuPay";

        return "";
    };

    /* ---------------- Format Card Number ---------------- */

    const handleCardNumber = (text) => {

        let cleaned = text.replace(/\D/g, "");

        let formatted = cleaned
            .match(/.{1,4}/g)
            ?.join(" ")
            .substring(0, 19) || "";

        setCardNumber(formatted);
        setBrand(detectBrand(cleaned));

    };

    /* ---------------- Expiry Formatter ---------------- */

    const handleExpiry = (text) => {

        let cleaned = text.replace(/\D/g, "");

        if (cleaned.length >= 3)
            cleaned = cleaned.substring(0, 2) + "/" + cleaned.substring(2, 4);

        setExpiry(cleaned.substring(0, 5));

    };

    /* ---------------- Save Card ---------------- */

    const saveCard = async () => {

        const cleanNumber = cardNumber.replace(/\s/g, "");

        if (!validateCard(cleanNumber)) {
            return Alert.alert("Invalid Card", "Card number is invalid");
        }

        try {

            const response = axios.post("http://10.0.2.2:5000/api/cards", {
                cardNumber: cleanNumber,
                cardName,
                expiry,
                brand
            }
            );

            console.log("SERVER RESPONSE:", response.data);

            Alert.alert("Success", "Card saved successfully");

            navigation.goBack();

        } catch (err) {

            console.log("CARD SAVE ERROR:", err.response?.data || err.message);

            Alert.alert("Error", "Could not save card");

        }

    };

    return (

        <View style={styles.container}>

            <View style={styles.header}>

                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={26} color={Colors.black} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Add Card</Text>

            </View>

            <View style={styles.form}>

                <Text style={styles.label}>Card Number</Text>

                <TextInput
                    value={cardNumber}
                    onChangeText={handleCardNumber}
                    placeholder="1234 5678 9012 3456"
                    keyboardType="numeric"
                    style={styles.input}
                />

                {brand !== "" && (
                    <Text style={styles.brand}>Detected: {brand}</Text>
                )}

                <Text style={styles.label}>Card Holder Name</Text>

                <TextInput
                    value={cardName}
                    onChangeText={setCardName}
                    placeholder="Name on card"
                    style={styles.input}
                />

                <View style={styles.row}>

                    <View style={{ flex: 1 }}>

                        <Text style={styles.label}>Expiry</Text>

                        <TextInput
                            value={expiry}
                            onChangeText={handleExpiry}
                            placeholder="MM/YY"
                            keyboardType="numeric"
                            style={styles.input}
                        />

                    </View>

                    <View style={{ width: 20 }} />

                    <View style={{ flex: 1 }}>

                        <Text style={styles.label}>CVV</Text>

                        <TextInput
                            value={cvv}
                            onChangeText={setCvv}
                            placeholder="123"
                            keyboardType="numeric"
                            secureTextEntry
                            style={styles.input}
                        />

                    </View>

                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={saveCard}
                >

                    <Text style={styles.buttonText}>Save Card</Text>

                </TouchableOpacity>

            </View>

        </View>

    );
};

export default AddCardScreen;

const createStyles = C => StyleSheet.create({

    container: { flex: 1, backgroundColor: C.surface },

    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderColor: C.border
    },

    headerTitle: {
        fontSize: 20,
        marginLeft: 15,
        fontWeight: "600"
    },

    form: {
        padding: 20
    },

    label: {
        marginBottom: 6,
        color: C.textSecondary
    },

    input: {
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 10,
        padding: 14,
        marginBottom: 16
    },

    row: {
        flexDirection: "row"
    },

    button: {
        backgroundColor: C.primary,
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10
    },

    buttonText: {
        color: C.white,
        fontWeight: "700",
        fontSize: 16
    },

    brand: {
        marginBottom: 10,
        color: C.primary,
        fontWeight: "600"
    }

});
