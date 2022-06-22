// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    CameraQuickAction,
    FileQuickAction,
    ImageQuickAction,
    InputQuickAction,
    NavigationHeader,
    PostDraft,
    PostList,
    SendButton,
} from '@support/ui/component';
import {
    ChannelListScreen,
    PostOptionsScreen,
    ThreadScreen,
} from '@support/ui/screen';
import {timeouts, wait} from '@support/utils';
import {expect} from 'detox';

class ChannelScreen {
    testID = {
        channelScreenPrefix: 'channel.',
        channelScreen: 'channel.screen',
        introDisplayName: 'channel_post_list.intro.display_name',
        introOptionAddPeopleItem: 'channel_post_list.intro.option_item.add_people',
        introOptionSetHeaderItem: 'channel_post_list.intro.option_item.set_header',
        introOptionChannelDetailsItem: 'channel_post_list.intro.option_item.channel_details',
        flatPostList: 'channel.post_list.flat_list',
    };

    channelScreen = element(by.id(this.testID.channelScreen));
    introDisplayName = element(by.id(this.testID.introDisplayName));
    introOptionAddPeopleItem = element(by.id(this.testID.introOptionAddPeopleItem));
    introOptionSetHeaderItem = element(by.id(this.testID.introOptionSetHeaderItem));
    introOptionChannelDetailsItem = element(by.id(this.testID.introOptionChannelDetailsItem));
    flatPostList = element(by.id(this.testID.flatPostList));

    // convenience props
    backButton = NavigationHeader.backButton;
    headerTitle = NavigationHeader.headerTitle;
    atInputQuickAction = InputQuickAction.getAtInputQuickAction(this.testID.channelScreenPrefix);
    atInputQuickActionDisabled = InputQuickAction.getAtInputQuickActionDisabled(this.testID.channelScreenPrefix);
    slashInputQuickAction = InputQuickAction.getSlashInputQuickAction(this.testID.channelScreenPrefix);
    slashInputQuickActionDisabled = InputQuickAction.getSlashInputQuickActionDisabled(this.testID.channelScreenPrefix);
    fileQuickAction = FileQuickAction.getFileQuickAction(this.testID.channelScreenPrefix);
    fileQuickActionDisabled = FileQuickAction.getFileQuickActionDisabled(this.testID.channelScreenPrefix);
    imageQuickAction = ImageQuickAction.getImageQuickAction(this.testID.channelScreenPrefix);
    imageQuickActionDisabled = ImageQuickAction.getImageQuickActionDisabled(this.testID.channelScreenPrefix);
    cameraQuickAction = CameraQuickAction.getCameraQuickAction(this.testID.channelScreenPrefix);
    cameraQuickActionDisabled = CameraQuickAction.getCameraQuickActionDisabled(this.testID.channelScreenPrefix);
    postDraft = PostDraft.getPostDraft(this.testID.channelScreenPrefix);
    postDraftArchived = PostDraft.getPostDraftArchived(this.testID.channelScreenPrefix);
    postDraftReadOnly = PostDraft.getPostDraftReadOnly(this.testID.channelScreenPrefix);
    postInput = PostDraft.getPostInput(this.testID.channelScreenPrefix);
    sendButton = SendButton.getSendButton(this.testID.channelScreenPrefix);
    sendButtonDisabled = SendButton.getSendButtonDisabled(this.testID.channelScreenPrefix);

    postList = new PostList(this.testID.channelScreenPrefix);

    getIntroOptionItemLabel = (introOptionItemTestId: string) => {
        return element(by.id(`${introOptionItemTestId}.label`));
    };

    getMoreMessagesButton = () => {
        return this.postList.getMoreMessagesButton();
    };

    getNewMessagesDivider = () => {
        return this.postList.getNewMessagesDivider();
    };

    getPostListPostItem = (postId: string, text: string, postProfileOptions: any = {}) => {
        return this.postList.getPost(postId, text, postProfileOptions);
    };

    getPostMessageAtIndex = (index: number) => {
        return this.postList.getPostMessageAtIndex(index);
    };

    toBeVisible = async () => {
        await waitFor(this.channelScreen).toExist().withTimeout(timeouts.TEN_SEC);

        return this.channelScreen;
    };

    open = async (categoryKey: string, channelName: string) => {
        // # Open channel screen
        await ChannelListScreen.getChannelItemDisplayName(categoryKey, channelName).tap();

        return this.toBeVisible();
    };

    back = async () => {
        await this.backButton.tap();
        await expect(this.channelScreen).not.toBeVisible();
    };

    openPostOptionsFor = async (postId: string, text: string) => {
        const {postListPostItem} = this.getPostListPostItem(postId, text);
        await expect(postListPostItem).toBeVisible();

        // # Open post options
        await postListPostItem.longPress();
        await PostOptionsScreen.toBeVisible();
        await wait(timeouts.TWO_SEC);
    };

    openReplyThreadFor = async (postId: string, text: string) => {
        await this.openPostOptionsFor(postId, text);

        // # Open reply thread screen
        await PostOptionsScreen.replyPostOption.tap();
        await ThreadScreen.toBeVisible();
    };

    postMessage = async (message: string) => {
        // # Post message
        await this.postInput.tap();
        await this.postInput.replaceText(message);
        await this.tapSendButton();
    };

    tapSendButton = async () => {
        // # Tap send button
        await this.sendButton.tap();
        await expect(this.sendButton).not.toExist();
        await expect(this.sendButtonDisabled).toBeVisible();
    };

    hasPostMessage = async (postId: string, postMessage: string) => {
        const {postListPostItem} = this.getPostListPostItem(postId, postMessage);
        await expect(postListPostItem).toBeVisible();
    };

    hasPostMessageAtIndex = async (index: number, postMessage: string) => {
        await expect(
            this.getPostMessageAtIndex(index),
        ).toHaveText(postMessage);
    };
}

const channelScreen = new ChannelScreen();
export default channelScreen;
