import api from "../api/base";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const sendOTP = async (mobile_number) => {
  try {
    const res = await api.post("/auth/request-otp", {
      mobileNumber: mobile_number,
    });
    return res.data;
  } catch (error) {
    console.error("SEND OTP ERROR:", error?.response?.data || error.message);
    throw error;
  }
};

export const verifyOTP = async (mobile_number, otp) => {
  try {
    const res = await api.post("/auth/verify-otp", {
      mobileNumber: mobile_number,
      otp,
      device_info: null,
    });

    const data = res.data.data;
    // data fields from snake_case_lower serializer:
    // user_id, full_name, mobile_number, role, access_token, refresh_token, is_new_user

    // ✅ Save user with snake_case keys — consistent with UserProfileDto
    const user = {
      user_id: data.user_id,
      full_name: data.full_name,
      mobile_number: data.mobile_number,
      role: data.role,
      staff_role: data.staff_role ?? null,
      is_new_user: data.is_new_user,
      email: null,      // not in VerifyOtpResponseDto — fetched via GET /me
      avatar_url: null,      // not in VerifyOtpResponseDto — fetched via GET /me
    };

    await AsyncStorage.multiSet([
      ["access_token", data.access_token],
      ["refresh_token", data.refresh_token],
      ["user", JSON.stringify(user)],
    ]);

    return data;
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error?.response?.data || error.message);
    throw error;
  }
};

export const getStoredUser = async () => {
  try {
    const user = await AsyncStorage.getItem("user");
    const token = await AsyncStorage.getItem("access_token");
    if (user && token) return JSON.parse(user);
    return null;
  } catch (error) {
    console.error("GET USER ERROR:", error);
    return null;
  }
};

export const logout = async () => {
  try {
    const refresh_token = await AsyncStorage.getItem("refresh_token");
    if (refresh_token) {
      await api.post("/auth/logout", { refresh_token });
    }
  } catch (_) { }
  await AsyncStorage.multiRemove(["access_token", "refresh_token", "user"]);
};