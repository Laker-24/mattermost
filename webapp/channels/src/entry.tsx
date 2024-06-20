// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import ReactDOM from 'react-dom';

import {logError} from 'mattermost-redux/actions/errors';

import store from 'stores/redux_store';

import App from 'components/app';

import {AnnouncementBarTypes} from 'utils/constants';
import {setCSRFFromCookie} from 'utils/utils';

// Import our styles
import './sass/styles.scss';
import 'katex/dist/katex.min.css';

import '@mattermost/compass-icons/css/compass-icons.css';
import '@mattermost/components/dist/index.esm.css';

import mysql from 'mysql2/promise';
declare global {
    interface Window {
        publicPath?: string;
    }
}

// This is for anything that needs to be done for ALL react components.
// This runs before we start to render anything.
function preRenderSetup(onPreRenderSetupReady: () => void) {
    window.onerror = (msg, url, line, column, error) => {
        if (msg === 'ResizeObserver loop limit exceeded') {
            return;
        }

        store.dispatch(
            logError(
                {
                    type: AnnouncementBarTypes.DEVELOPER,
                    message: 'A JavaScript error in the webapp client has occurred. (msg: ' + msg + ', row: ' + line + ', col: ' + column + ').',
                    stack: error?.stack,
                    url,
                },
                true,
                true,
            ),
        );
    };

    setCSRFFromCookie();

    onPreRenderSetupReady();
}

function renderReactRootComponent() {
    ReactDOM.render((
        <App/>
    ),
    document.getElementById('root'));
}

/**
 * Adds a function to be invoked when the DOM content is loaded.
 */
function appendOnDOMContentLoadedEvent(onDomContentReady: () => void) {
    if (document.readyState === 'loading') {
        // If the DOM hasn't finished loading, add an event listener and call the function when it does
        document.addEventListener('DOMContentLoaded', onDomContentReady);
    } else {
        // If the DOM is already loaded, call the function immediately
        onDomContentReady();
    }
}

appendOnDOMContentLoadedEvent(() => {
    // Do the pre-render setup and call renderReactRootComponent when done
    preRenderSetup(renderReactRootComponent);
});

// 配置数据库连接
const dbConfig = {
    host: '101.43.103.236:3307',
    user: 'mmuser',
    password: 'mmuser_password',
    database: 'db'
};

// 定义删除超过24小时记录的函数
async function deleteOldPosts() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows, fields] = await connection.execute(`
            DELETE FROM Posts WHERE CreateAt < ?
        `, [Date.now() * 1000 - 24 * 60 * 60 * 1000 * 1000]);

        console.log(`Deleted ${rows.affectedRows} old posts`);
    } catch (err) {
        console.error('Failed to delete old posts:', err);
    } finally {
        await connection.end();
    }
}

// 定时器函数，每隔5分钟执行一次
function scheduleDelete() {
    deleteOldPosts();
    setInterval(deleteOldPosts, 5 * 60 * 1000); // 每5分钟执行一次
}

// 组件挂载时自动执行
scheduleDelete();
