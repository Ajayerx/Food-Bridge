import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Colors} from '../../constants/colors';

export const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  onPress,
  editable = true,
  autoFocus = false,
}) => (
  <TouchableOpacity
    style={styles.container}
    onPress={onPress}
    activeOpacity={editable ? 1 : 0.7}>
    <Icon name="search" size={22} color={Colors.textSecondary} />
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textLight}
      editable={editable}
      autoFocus={autoFocus}
      returnKeyType="search"
    />
    {value?.length > 0 && (
      <TouchableOpacity onPress={onClear} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Icon name="cancel" size={20} color={Colors.textLight} />
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    ...Platform.select({
      ios: {shadowColor: Colors.black, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.06, shadowRadius: 4},
      android: {elevation: 2},
    }),
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    padding: 0,
  },
});
