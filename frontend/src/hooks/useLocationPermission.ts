import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';
import { useAlert } from '@/src/context/AlertContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_PREF_KEY = 'locationEnabled';

export function useLocationPermission() {
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
    const { showAlert } = useAlert();

    // Load saved preference & sync with actual permission on mount
    useEffect(() => {
        (async () => {
            const { status } = await Location.getForegroundPermissionsAsync();
            setPermissionStatus(status);

            const savedPref = await AsyncStorage.getItem(LOCATION_PREF_KEY);
            // If OS permission is revoked, override stored pref to false
            if (status !== Location.PermissionStatus.GRANTED) {
                setLocationEnabled(false);
                await AsyncStorage.setItem(LOCATION_PREF_KEY, 'false');
            } else {
                setLocationEnabled(savedPref === 'true');
            }
        })();
    }, []);

    /**
     * Toggle called from Settings:
     *  ON  → request OS permission; if denied, open Settings
     *  OFF → ask user to revoke from Settings (OS limitation)
     */
    const toggleLocation = useCallback(async (value: boolean) => {
        if (value) {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionStatus(status);

            if (status === Location.PermissionStatus.GRANTED) {
                setLocationEnabled(true);
                await AsyncStorage.setItem(LOCATION_PREF_KEY, 'true');
            } else {
                // User denied — offer to open device settings
                showAlert(
                    'Cần quyền truy cập vị trí',
                    'Ứng dụng cần quyền truy cập vị trí để hoạt động. Vui lòng cấp quyền trong Cài đặt thiết bị.',
                    [
                        { text: 'Hủy', style: 'cancel' },
                        {
                            text: 'Mở Cài đặt',
                            onPress: () => Linking.openSettings(),
                        },
                    ]
                );
            }
        } else {
            // Cannot revoke OS permission programmatically — inform user
            showAlert(
                'Tắt quyền vị trí',
                'Để tắt hoàn toàn, hãy vào Cài đặt thiết bị › Ứng dụng › Quyền và thu hồi quyền Vị trí.',
                [
                    { text: 'Để sau', style: 'cancel' },
                    {
                        text: 'Mở Cài đặt',
                        onPress: () => Linking.openSettings(),
                    },
                ]
            );
            // Also disable inside the app immediately
            setLocationEnabled(false);
            await AsyncStorage.setItem(LOCATION_PREF_KEY, 'false');
        }
    }, []);

    /**
     * Get current position — respects the in-app toggle.
     * Returns null if disabled or permission denied.
     */
    const getCurrentPosition = useCallback(async () => {
        if (!locationEnabled) {
            showAlert(
                'Vị trí đang tắt',
                'Bật vị trí trong Cài đặt của ứng dụng để sử dụng tính năng này.',
            );
            return null;
        }

        try {
            const isServiceEnabled = await Location.hasServicesEnabledAsync();
            if (!isServiceEnabled) {
                showAlert(
                    'Dịch vụ vị trí tắt',
                    'Vui lòng bật dịch vụ vị trí (GPS) trên thiết bị của bạn.',
                    [
                        { text: 'Hủy', style: 'cancel' },
                        { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
                    ]
                );
                return null;
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== Location.PermissionStatus.GRANTED) {
                showAlert('Lỗi', 'Cần cấp quyền truy cập vị trí');
                return null;
            }

            return await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
        } catch (error: any) {
            showAlert('Lỗi vị trí', error.message || 'Không thể lấy vị trí hiện tại');
            return null;
        }
    }, [locationEnabled]);

    return { locationEnabled, permissionStatus, toggleLocation, getCurrentPosition };
}
