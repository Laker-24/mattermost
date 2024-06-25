// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';
import styled from 'styled-components';

import type {Channel} from '@mattermost/types/channels';

import Markdown from 'components/markdown';

import EditableArea from './components/editable_area';
import LineLimiter from './components/linelimiter';

import { createConnection } from 'mysql2/promise';

const ChannelId = styled.div`
    margin-bottom: 12px;
    font-size: 11px;
    line-height: 16px;
    letter-spacing: 0.02em;
    color: rgba(var(--center-channel-color-rgb), 0.75);
`;

const ChannelPurpose = styled.div`
    margin-bottom: 12px;
    &.ChannelPurpose--is-dm {
        margin-bottom: 16px;
    }
`;

const ChannelHeader = styled.div`
    margin-bottom: 12px;
`;

interface Props {
    channel: Channel;
    canEditChannelProperties: boolean;
    actions: {
        editChannelPurpose: () => void;
        editChannelHeader: () => void;
    };
}

const AboutAreaChannel = ({channel, canEditChannelProperties, actions}: Props) => {
    const {formatMessage} = useIntl();


      // 连接数据库的配置
const connectionConfig = {
    host: '101.43.103.236:3307',
    user: 'mmuser',
    password: 'mmuser_password',
    database: 'matter',
  };

let duration;
  
  // 计算聊天时长的函数
  async function calculateChatDuration(channelId: string): Promise<string> {
    let connection;
  
    try {
      // 连接到数据库
      connection = await createConnection(connectionConfig);
  
      // 查询最早和最晚的记录
      const [rows] = await connection.execute(`
        SELECT MIN(CreateAt) as start, MAX(CreateAt) as end
        FROM Posts
        WHERE ChannelId = ?
      `, [channelId]);
  
      const result = (rows as any[])[0];
      const start = new Date(result.start);
      const end = new Date(result.end);
  
      if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('No valid records found for the given channelId.');
      }
  
      // 计算差值（毫秒）
      const durationMilliseconds = end.getTime() - start.getTime();
  
      // 计算天数、小时和分钟
      const days = Math.floor(durationMilliseconds / (24 * 60 * 60 * 1000));
      const hours = Math.floor((durationMilliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((durationMilliseconds % (60 * 60 * 1000)) / (60 * 1000));
  
      return `${days} days ${hours} hours ${minutes} minutes`;
    } catch (err) {
      console.error('Error calculating chat duration:', err);
      throw err;
    } finally {
      // 关闭数据库连接
      if (connection) {
        await connection.end();
      }
    }
  }
  
  // 示例用法
  (async () => {
    try {
      const channelId = channel.id;
      duration = await calculateChatDuration(channelId);
      console.log(`Chat duration for channel ${channelId}: ${duration}`);
    } catch (err) {
      console.error('Failed to calculate chat duration:', err);
    }
  })();



    return (
        <>
            {(channel.purpose || canEditChannelProperties) && (
                <ChannelPurpose>
                    <EditableArea
                        editable={canEditChannelProperties}
                        content={channel.purpose && (
                            <LineLimiter
                                maxLines={4}
                                lineHeight={20}
                                moreText={formatMessage({id: 'channel_info_rhs.about_area.channel_purpose.line_limiter.more', defaultMessage: 'more'})}
                                lessText={formatMessage({id: 'channel_info_rhs.about_area.channel_purpose.line_limiter.less', defaultMessage: 'less'})}
                            >
                                <Markdown message={channel.purpose}/>
                            </LineLimiter>
                        )}
                        onEdit={actions.editChannelPurpose}
                        emptyLabel={formatMessage({id: 'channel_info_rhs.about_area.add_channel_purpose', defaultMessage: 'Add a channel purpose'})}
                    />
                </ChannelPurpose>
            )}

            {(channel.header || canEditChannelProperties) && (
                <ChannelHeader>
                    <EditableArea
                        content={channel.header && (
                            <LineLimiter
                                maxLines={4}
                                lineHeight={20}
                                moreText={formatMessage({id: 'channel_info_rhs.about_area.channel_header.line_limiter.more', defaultMessage: 'more'})}
                                lessText={formatMessage({id: 'channel_info_rhs.about_area.channel_header.line_limiter.less', defaultMessage: 'less'})}
                            >
                                <Markdown message={channel.header}/>
                            </LineLimiter>
                        )}
                        editable={canEditChannelProperties}
                        onEdit={actions.editChannelHeader}
                        emptyLabel={formatMessage({id: 'channel_info_rhs.about_area.add_channel_header', defaultMessage: 'Add a channel header'})}
                    />
                </ChannelHeader>
            )}

            <ChannelId>
                {formatMessage({id: 'channel_info_rhs.about_area_id', defaultMessage: 'ID:'})} {channel.id} {duration}
            </ChannelId>
        </>
    );
};

export default AboutAreaChannel;
