package api4

import (
	"database/sql"
	"log"
	"time"

	"github.com/go-sql-driver/mysql"
)

func deleteOldPosts(db *sql.DB) {
	// 计算24小时前的时间戳
	expirationTime := time.Now().Add(-24 * time.Hour).UnixNano() / int64(time.Microsecond)

	// 删除超过24小时的记录
	query := `DELETE FROM Posts WHERE CreateAt < ?`
	result, err := db.Exec(query, expirationTime)
	if err != nil {
		log.Printf("Failed to delete old posts: %v", err)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Failed to get affected rows: %v", err)
		return
	}

	log.Printf("Deleted %d old posts", rowsAffected)
}

func scheduledDelete(db *sql.DB) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			deleteOldPosts(db)
		}
	}
}

// func main() {
// 	// 初始化数据库连接
// 	dsn := "mmuser:mmuser_password@tcp(101.43.103.236:3307)/mattermost"
// 	db, err := sql.Open("mysql", dsn)
// 	if err != nil {
// 		log.Fatalf("Failed to connect to database: %v", err)
// 	}
// 	defer db.Close()

// 	// 启动定时删除任务
// 	go scheduledDelete(db)

// 	// 保持主程序运行
// 	select {}
// }