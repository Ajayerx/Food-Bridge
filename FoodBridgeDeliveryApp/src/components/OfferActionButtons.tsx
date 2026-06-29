import React from 'react';
import {View} from 'react-native';
import {Button} from '@/components/ui/Button';
import {useTheme} from '@/theme/ThemeProvider';

interface OfferActionButtonsProps {
  onAccept: () => void;
  onDecline: () => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

export const OfferActionButtons: React.FC<OfferActionButtonsProps> = ({
  onAccept,
  onDecline,
  isAccepting,
  isRejecting,
}) => {
  const {spacing} = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
      }}>
      <View style={{flex: 1}}>
        <Button
          title="Decline"
          onPress={onDecline}
          variant="danger"
          loading={isRejecting}
          disabled={isAccepting}
          size="lg"
        />
      </View>
      <View style={{flex: 1}}>
        <Button
          title="Accept"
          onPress={onAccept}
          variant="primary"
          loading={isAccepting}
          disabled={isRejecting}
          size="lg"
        />
      </View>
    </View>
  );
};
