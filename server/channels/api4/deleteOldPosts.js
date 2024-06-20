const mysql = require('mysql2/promise');

// 配置数据库连接
const dbConfig = {
    host: '101.43.103.236',
    port: '3307',
    user: 'mmuser',
    password: 'mmuser_password',
    database: 'db'
};

// 定义删除超过24小时记录的函数
async function deleteOldPosts() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [result] = await connection.execute(`
            DELETE FROM Posts WHERE CreateAt < ?
        `, [Date.now() - 24 * 60 * 60 * 1000]);

        console.log(`Deleted ${result.affectedRows} old posts`);
    } catch (err) {
        console.error('Failed to delete old posts:', err);
    } finally {
        await connection.end();
    }
}

// 定时器函数，每隔5分钟执行一次
function scheduleDelete() {
    deleteOldPosts(); // 立即执行一次
    setInterval(async () => {
        await deleteOldPosts();
    }, 5 * 60 * 1000); // 每5分钟执行一次
}

// 脚本启动时自动执行
scheduleDelete();
