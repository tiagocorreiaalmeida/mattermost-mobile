// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useMemo} from 'react';
import {useIntl} from 'react-intl';
import {Alert, Platform, ScrollView, View} from 'react-native';
import {Edge, SafeAreaView} from 'react-native-safe-area-context';

import CompassIcon from '@components/compass_icon';
import {Screens} from '@constants';
import {useServerDisplayName} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import useNavButtonPressed from '@hooks/navigation_button_pressed';
import {dismissModal, goToScreen, setButtons} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {tryOpenURL} from '@utils/url';

import SettingOption from './setting_option';

const edges: Edge[] = ['left', 'right'];
const CLOSE_BUTTON_ID = 'close-settings';

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            flex: 1,
        },
        contentContainerStyle: {
            marginTop: 20,
        },
        containerStyle: {
            paddingLeft: 8,
            marginTop: 20,
        },
        helpGroup: {
            width: '91%',
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
            height: 1,
            alignSelf: 'center',
            marginTop: 20,
        },
    };
});

type SettingsProps = {
    componentId: string;
    helpLink: string;
    showHelp: boolean;
    siteName: string;
}

//todo: handle display on tablet and Profile the whole feature - https://mattermost.atlassian.net/browse/MM-39711

const Settings = ({componentId, helpLink, showHelp, siteName}: SettingsProps) => {
    const theme = useTheme();
    const intl = useIntl();
    const serverDisplayName = useServerDisplayName();

    const serverName = siteName || serverDisplayName;
    const styles = getStyleSheet(theme);

    const closeButton = useMemo(() => {
        return {
            id: CLOSE_BUTTON_ID,
            icon: CompassIcon.getImageSourceSync('close', 24, theme.centerChannelColor),
            testID: CLOSE_BUTTON_ID,
        };
    }, [theme.centerChannelColor]);

    const close = () => {
        dismissModal({componentId});
    };

    useEffect(() => {
        setButtons(componentId, {
            leftButtons: [closeButton],
        });
    }, []);

    useAndroidHardwareBackHandler(componentId, close);

    useNavButtonPressed(CLOSE_BUTTON_ID, componentId, close, []);

    const goToNotifications = preventDoubleTap(() => {
        const screen = Screens.SETTINGS_NOTIFICATION;
        const title = intl.formatMessage({id: 'settings.notifications', defaultMessage: 'Notifications'});

        goToScreen(screen, title);
    });

    const goToDisplaySettings = preventDoubleTap(() => {
        const screen = Screens.SETTINGS_DISPLAY;
        const title = intl.formatMessage({id: 'settings.display', defaultMessage: 'Display'});

        goToScreen(screen, title);
    });

    const goToAbout = preventDoubleTap(() => {
        const screen = Screens.ABOUT;
        const title = intl.formatMessage({id: 'settings.about', defaultMessage: 'About {appTitle}'}, {appTitle: serverName});

        goToScreen(screen, title);
    });

    const goToAdvancedSettings = preventDoubleTap(() => {
        const screen = Screens.SETTINGS_ADVANCED;
        const title = intl.formatMessage({id: 'settings.advanced_settings', defaultMessage: 'Advanced Settings'});

        goToScreen(screen, title);
    });

    const openHelp = preventDoubleTap(() => {
        const link = helpLink ? helpLink.toLowerCase() : '';

        if (link) {
            const onError = () => {
                Alert.alert(
                    intl.formatMessage({id: 'mobile.link.error.title', defaultMessage: 'Error'}),
                    intl.formatMessage({id: 'mobile.link.error.text', defaultMessage: 'Unable to open the link.'}),
                );
            };

            tryOpenURL(link, onError);
        }
    });

    return (
        <SafeAreaView
            edges={edges}
            style={styles.container}
            testID='account.screen'
        >
            <ScrollView
                alwaysBounceVertical={false}
                contentContainerStyle={styles.contentContainerStyle}
            >
                <SettingOption
                    onPress={goToNotifications}
                    optionName='notification'
                />
                <SettingOption
                    onPress={goToDisplaySettings}
                    optionName='display'
                />
                <SettingOption
                    onPress={goToAdvancedSettings}
                    optionName='advanced_settings'
                />
                <SettingOption
                    messageValues={{appTitle: serverName}}
                    onPress={goToAbout}
                    optionName='about'
                />
                {Platform.OS === 'android' && <View style={styles.helpGroup}/>}
                {showHelp &&
                    <SettingOption
                        containerStyle={styles.containerStyle}
                        isLink={true}
                        onPress={openHelp}
                        optionName='help'
                        separator={false}
                    />
                }
            </ScrollView>
        </SafeAreaView>
    );
};

export default Settings;
