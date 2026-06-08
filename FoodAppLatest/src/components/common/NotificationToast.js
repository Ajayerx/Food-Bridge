import React, { useEffect, useRef } from "react";
import {
    Animated,
    TouchableOpacity,
    Text,
    View,
    StyleSheet,
    Platform,
} from "react-native";
import { useNotificationStore } from "../../store/notificationStore";

function Toast({ notification, onDismiss, onPress }) {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 60,
                friction: 10,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        const timer = setTimeout(() => dismiss(), 4000);
        return () => clearTimeout(timer);
    }, []);

    const dismiss = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => onDismiss(notification.id));
    };

    const handlePress = () => {
        dismiss();
        onPress?.(notification);
    };

    return (
        <Animated.View
            style={[
                styles.toast,
                { transform: [{ translateY }], opacity },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handlePress}
                style={styles.inner}
            >
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>🔔</Text>
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                        {notification.title}
                    </Text>
                    <Text style={styles.body} numberOfLines={2}>
                        {notification.body}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export function NotificationToast({ onPress }) {
    const { popupQueue, dismissPopup } = useNotificationStore();

    const current = popupQueue[0];
    if (!current) return null;

    return (
        <Toast
            key={current.id}
            notification={current}
            onDismiss={dismissPopup}
            onPress={onPress}
        />
    );
}

const styles = StyleSheet.create({
    toast: {
        position: "absolute",
        top: Platform.OS === "ios" ? 54 : 16,
        left: 16,
        right: 16,
        zIndex: 9999,
        elevation: 9999,            // ✅ Android needs high elevation to render above Stack.Navigator
        borderRadius: 14,
        backgroundColor: "#1C1C1E",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    inner: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#2C2C2E",
        alignItems: "center",
        justifyContent: "center",
    },
    icon: { fontSize: 18 },
    textContainer: { flex: 1 },
    title: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 2,
    },
    body: {
        color: "#ABABAB",
        fontSize: 13,
        lineHeight: 18,
    },
});