// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {act, renderHook} from '@testing-library/react-hooks';
import InCallManager from 'react-native-incall-manager';

import * as CallsActions from '@app/products/calls/actions';
import {connection} from '@app/products/calls/actions/calls';
import * as Permissions from '@app/products/calls/actions/permissions';
import * as State from '@app/products/calls/state';
import {setCallsConfig, useCallsConfig} from '@app/products/calls/state/calls_config';
import {setChannelsWithCalls, useChannelsWithCalls} from '@app/products/calls/state/channels_with_calls';
import {useCurrentCall, setCurrentCall} from '@app/products/calls/state/current_call';
import {
    Call,
    CallsState,
    ChannelsWithCalls,
    CurrentCall,
    DefaultCallsConfig,
    DefaultCallsState,
} from '@app/products/calls/types/calls';
import NetworkManager from '@managers/network_manager';
import {getIntlShape} from '@test/intl-test-helper';

import {setCallsState, useCallsState} from '../state/calls_state';

const mockClient = {
    getCalls: jest.fn(() => [
        {
            call: {
                users: ['user-1', 'user-2'],
                states: {
                    'user-1': {unmuted: true},
                    'user-2': {unmuted: false},
                },
                start_at: 123,
                screen_sharing_id: '',
                thread_id: 'thread-1',
            },
            channel_id: 'channel-1',
            enabled: true,
        },
    ]),
    getCallsConfig: jest.fn(() => ({
        ICEServers: ['mattermost.com'],
        AllowEnableCalls: true,
        DefaultEnabled: true,
        last_retrieved_at: 1234,
    })),
    getPluginsManifests: jest.fn(() => (
        [
            {id: 'playbooks'},
            {id: 'com.mattermost.calls'},
        ]
    )),
    enableChannelCalls: jest.fn(),
    disableChannelCalls: jest.fn(),
};

jest.mock('@app/products/calls/connection/connection', () => ({
    newConnection: jest.fn(() => Promise.resolve({
        disconnect: jest.fn(),
        mute: jest.fn(),
        unmute: jest.fn(),
        waitForReady: jest.fn(() => Promise.resolve()),
    })),
}));

const addFakeCall = (serverUrl: string, channelId: string) => {
    const call = {
        participants: {
            xohi8cki9787fgiryne716u84o: {id: 'xohi8cki9787fgiryne716u84o', muted: false, raisedHand: 0},
            xohi8cki9787fgiryne716u841: {id: 'xohi8cki9787fgiryne716u84o', muted: true, raisedHand: 0},
            xohi8cki9787fgiryne716u842: {id: 'xohi8cki9787fgiryne716u84o', muted: false, raisedHand: 0},
            xohi8cki9787fgiryne716u843: {id: 'xohi8cki9787fgiryne716u84o', muted: true, raisedHand: 0},
            xohi8cki9787fgiryne716u844: {id: 'xohi8cki9787fgiryne716u84o', muted: false, raisedHand: 0},
            xohi8cki9787fgiryne716u845: {id: 'xohi8cki9787fgiryne716u84o', muted: true, raisedHand: 0},
        },
        channelId,
        startTime: (new Date()).getTime(),
        screenOn: '',
        threadId: 'abcd1234567',
    } as Call;
    act(() => {
        State.callStarted(serverUrl, call);
    });
};

describe('Actions.Calls', () => {
    const {newConnection} = require('@app/products/calls/connection/connection');
    InCallManager.setSpeakerphoneOn = jest.fn();
    // eslint-disable-next-line
    // @ts-ignore
    NetworkManager.getClient = () => mockClient;
    const intl = getIntlShape();
    jest.spyOn(Permissions, 'hasMicrophonePermission').mockReturnValue(Promise.resolve(true));

    beforeAll(() => {
        // create subjects
        const {result} = renderHook(() => {
            return [useCallsState('server1'), useChannelsWithCalls('server1'), useCurrentCall(), useCallsConfig('server1')];
        });

        assert.deepEqual(result.current[0], DefaultCallsState);
        assert.deepEqual(result.current[1], {});
        assert.deepEqual(result.current[2], null);
        assert.deepEqual(result.current[3], DefaultCallsConfig);
    });

    beforeEach(() => {
        newConnection.mockClear();
        mockClient.getCalls.mockClear();
        mockClient.getCallsConfig.mockClear();
        mockClient.getPluginsManifests.mockClear();
        mockClient.enableChannelCalls.mockClear();
        mockClient.disableChannelCalls.mockClear();

        // reset to default state for each test
        act(() => {
            setCallsState('server1', DefaultCallsState);
            setChannelsWithCalls('server1', {});
            setCurrentCall(null);
            setCallsConfig('server1', DefaultCallsConfig);
        });
    });

    it('joinCall', async () => {
        // setup
        const {result} = renderHook(() => {
            return [useCallsState('server1'), useCurrentCall()];
        });
        addFakeCall('server1', 'channel-id');

        let response: { data?: string };
        await act(async () => {
            response = await CallsActions.joinCall('server1', 'channel-id', intl);
        });

        assert.equal(response!.data, 'channel-id');
        assert.equal((result.current[1] as CurrentCall).channelId, 'channel-id');
        expect(newConnection).toBeCalled();
        expect(newConnection.mock.calls[0][1]).toBe('channel-id');
        CallsActions.leaveCall();
    });

    it('leaveCall', async () => {
        // setup
        const {result} = renderHook(() => {
            return [useCallsState('server1'), useCurrentCall()];
        });
        addFakeCall('server1', 'channel-id');
        expect(connection).toBe(null);

        let response: { data?: string };
        await act(async () => {
            response = await CallsActions.joinCall('server1', 'channel-id', intl);
        });
        assert.equal(response!.data, 'channel-id');
        assert.equal((result.current[1] as CurrentCall | null)?.channelId, 'channel-id');

        expect(connection!.disconnect).not.toBeCalled();
        const disconnectMock = connection!.disconnect;
        CallsActions.leaveCall();
        expect(disconnectMock).toBeCalled();
        expect(connection).toBe(null);
        assert.equal((result.current[1] as CurrentCall | null), null);
    });

    it('muteMyself', async () => {
        // setup
        const {result} = renderHook(() => {
            return [useCallsState('server1'), useCurrentCall()];
        });
        addFakeCall('server1', 'channel-id');
        expect(connection).toBe(null);

        let response: { data?: string };
        await act(async () => {
            response = await CallsActions.joinCall('server1', 'channel-id', intl);
        });
        assert.equal(response!.data, 'channel-id');
        assert.equal((result.current[1] as CurrentCall | null)?.channelId, 'channel-id');

        CallsActions.muteMyself();
        expect(connection!.mute).toBeCalled();
        CallsActions.leaveCall();
    });

    it('unmuteMyself', async () => {
        // setup
        const {result} = renderHook(() => {
            return [useCallsState('server1'), useCurrentCall()];
        });
        addFakeCall('server1', 'channel-id');
        expect(connection).toBe(null);

        let response: { data?: string };
        await act(async () => {
            response = await CallsActions.joinCall('server1', 'channel-id', intl);
        });
        assert.equal(response!.data, 'channel-id');
        assert.equal((result.current[1] as CurrentCall | null)?.channelId, 'channel-id');

        CallsActions.unmuteMyself();
        expect(connection!.unmute).toBeCalled();
        CallsActions.leaveCall();
    });

    it('loadCalls', async () => {
        // setup
        const {result} = renderHook(() => {
            return [useCallsState('server1'), useChannelsWithCalls('server1'), useCurrentCall()];
        });

        await act(async () => {
            await CallsActions.loadCalls('server1', 'userId1');
        });
        expect(mockClient.getCalls).toBeCalled();
        assert.equal((result.current[0] as CallsState).calls['channel-1'].channelId, 'channel-1');
        assert.equal((result.current[0] as CallsState).enabled['channel-1'], true);
        assert.equal((result.current[1] as ChannelsWithCalls)['channel-1'], true);
        assert.equal((result.current[2] as CurrentCall | null), null);
    });

    it('loadConfig', async () => {
        // setup
        const {result} = renderHook(() => useCallsConfig('server1'));

        await act(async () => {
            await CallsActions.loadConfig('server1');
        });
        expect(mockClient.getCallsConfig).toBeCalledWith();
        assert.equal(result.current.DefaultEnabled, true);
        assert.equal(result.current.AllowEnableCalls, true);
    });

    it('enableChannelCalls', async () => {
        const {result} = renderHook(() => useCallsState('server1'));
        assert.equal(result.current.enabled['channel-1'], undefined);
        await act(async () => {
            await CallsActions.enableChannelCalls('server1', 'channel-1');
        });
        expect(mockClient.enableChannelCalls).toBeCalledWith('channel-1');
        assert.equal(result.current.enabled['channel-1'], true);
    });

    it('disableChannelCalls', async () => {
        const {result} = renderHook(() => useCallsState('server1'));
        assert.equal(result.current.enabled['channel-1'], undefined);
        await act(async () => {
            await CallsActions.enableChannelCalls('server1', 'channel-1');
        });
        expect(mockClient.enableChannelCalls).toBeCalledWith('channel-1');
        expect(mockClient.disableChannelCalls).not.toBeCalledWith('channel-1');
        assert.equal(result.current.enabled['channel-1'], true);
        await act(async () => {
            await CallsActions.disableChannelCalls('server1', 'channel-1');
        });
        expect(mockClient.disableChannelCalls).toBeCalledWith('channel-1');
        assert.equal(result.current.enabled['channel-1'], false);
    });
});
