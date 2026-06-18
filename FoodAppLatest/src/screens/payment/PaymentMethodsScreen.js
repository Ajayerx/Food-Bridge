import { useFocusEffect } from "@react-navigation/native";
import React, { useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../hooks/useTheme";

const PaymentMethodsScreen = ({ navigation }) => {

    const Colors = useTheme();
    const styles = useMemo(() => createStyles(Colors), [Colors]);

    const [cards, setCards] = useState([]);
    const fetchCards = async () => {

        try {

            const res = await axios.get("http://10.0.2.2:5000/api/cards");

            setCards(res.data);

        } catch (err) {

            console.log("FETCH CARDS ERROR:", err.message);

        }

    };
    useFocusEffect(
        useCallback(() => {

            fetchCards();

        }, [])
    );
    const Row = ({ icon, title, action }) => (
        <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
                <Icon name={icon} size={24} color={Colors.textSecondary} />
                <Text style={styles.rowText}>{title}</Text>
            </View>

            <Text style={styles.actionText}>{action}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>

            {/* Header */}

            <View style={styles.header}>

                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={26} color={Colors.black} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>PAYMENTS</Text>

            </View>

            <ScrollView>

                {/* UPI */}

                <Text style={styles.section}>UPI</Text>

                <Row
                    icon="account-balance-wallet"
                    title="Gpay UPI"
                    action="MANAGE"
                />

                {/* Saved Cards */}

                <Text style={styles.section}>SAVED CARDS</Text>

                <TouchableOpacity
                    style={styles.addCard}
                    onPress={() => navigation.navigate("AddCard")}
                >

                    <View style={styles.addIcon}>
                        <Icon name="add" size={20} color={Colors.primary} />
                    </View>

                    <Text style={styles.addText}>ADD NEW CARD</Text>

                </TouchableOpacity>
                {cards.map((card) => {

                    const last4 = card.cardNumber.slice(-4);

                    return (
                        <View key={card._id} style={styles.cardItem}>

                            <Text style={styles.cardText}>
                                {card.brand} **** {last4}
                            </Text>

                        </View>
                    );

                })}
                {/* Wallet */}

                <Text style={styles.section}>WALLET</Text>

                <Row
                    icon="account-balance-wallet"
                    title="Mobikwik"
                    action="LINK ACCOUNT"
                />

                <Row
                    icon="account-balance-wallet"
                    title="PhonePe"
                    action="LINK ACCOUNT"
                />

                <Row
                    icon="account-balance-wallet"
                    title="Amazon Pay"
                    action="LINK ACCOUNT"
                />

                {/* Corporate Wallet */}

                <Text style={styles.section}>CORPORATE WALLETS</Text>

                <Row
                    icon="business"
                    title="Bill To Company"
                    action="LINK ACCOUNT"
                />

                <View style={{ height: 40 }} />

            </ScrollView>

        </View>
    );
};

export default PaymentMethodsScreen;

const createStyles = C => StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: C.background
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: C.surface,
        borderBottomWidth: 1,
        borderColor: C.border
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginLeft: 16
    },

    section: {
        marginTop: 20,
        marginBottom: 8,
        paddingHorizontal: 16,
        fontWeight: "600",
        color: C.textLight
    },

    row: {
        backgroundColor: C.surface,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: C.border
    },

    rowLeft: {
        flexDirection: "row",
        alignItems: "center"
    },

    rowText: {
        marginLeft: 12,
        fontSize: 16
    },

    actionText: {
        color: C.primary,
        fontWeight: "600"
    },

    addCard: {
        backgroundColor: C.surface,
        flexDirection: "row",
        alignItems: "center",
        padding: 16
    },

    addIcon: {
        borderWidth: 1,
        borderColor: C.primary,
        padding: 4,
        marginRight: 10
    },

    addText: {
        color: C.primary,
        fontWeight: "700",
        fontSize: 16
    },

    cardBrands: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: C.surface,
        paddingVertical: 12
    },

    brand: {
        color: C.textLight,
        fontWeight: "600"
    },

    cardItem: {
        backgroundColor: C.surface,
        padding: 16,
        borderBottomWidth: 1,
        borderColor: C.border
    },

    cardText: {
        fontSize: 16,
        fontWeight: "500"
    },

});
