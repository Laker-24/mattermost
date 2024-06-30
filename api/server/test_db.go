package main

import (
    "database/sql"
    "fmt"
    "log"
    "time"

    _ "github.com/go-sql-driver/mysql"
)

func main() {
    // 配置数据库连接
    dsn := "mmuser:mmuser_password@tcp(101.43.103.236:3306)/mattermost?charset=utf8mb4,utf8&readTimeout=30s&writeTimeout=30s"

    db, err := sql.Open("mysql", dsn)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    // 验证连接
    err = db.Ping()
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println("Connected to the database!")

     // 每5分钟执行一次删除操作
     ticker := time.NewTicker(5 * time.Minute)
     quit := make(chan struct{})
 
     go func() {
         for {
             select {
             case <-ticker.C:
                 deleteOldPosts(db)
             case <-quit:
                 ticker.Stop()
                 return
             }
         }
     }()

      // 保持主程序运行
    select {}
}
func deleteOldPosts(db *sql.DB) {
    // 计算24小时之前的时间戳
    timestamp := time.Now().Add(-24 * time.Hour).Unix() * 1000 // 转换为毫秒

    // 执行删除操作
    result, err := db.Exec("DELETE FROM Posts WHERE CreateAt < ?", timestamp)
    if err != nil {
        log.Fatal(err)
    }

    // 获取受影响的行数
    rowsAffected, err := result.RowsAffected()
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Deleted %d old posts\n", rowsAffected)
}