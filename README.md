# NestJs_Test
使用者檔案權限系統
📖 題目背景：你正在為一個企業內部系統開發檔案管理模組。每個使用者可以上傳、下載、刪除檔案，並可設定特定使用者或群組的讀寫權限。

✅ 功能需求：請使用 **NestJS** 實作一個檔案存取 API，並實作權限控管機制：
1. 上傳檔案（POST /files）
Body:
```
{ 
    "filename": "report.pdf",
    "content": "Base64EncodedFileHere"
}
```
使用者上傳檔案後，該使用者成為檔案的擁有者。

2. 取得使用者可見的檔案列表（GET /files）
回傳該使用者有「讀取權限」的所有檔案。

3. 下載檔案（GET /files/:id）
僅當前使用者有該檔案的讀取權限才可下載。

4. 刪除檔案（DELETE /files/:id）
只能由該檔案的擁有者執行刪除。

5. 設定檔案權限（POST /files/:id/permissions）

Body:
```
{
    "userId": 2,
    "permission": "read" // or "write"
}
```

僅檔案擁有者可以設定其他使用者的權限。


🔒 權限控制要求：
- Middleware：
檢查請求中是否帶有有效的 Authorization header（模擬驗證，JWT 可省略實作細節）。
解碼使用者 ID 並注入到 request.user 中。
- Guard：
實作 PermissionsGuard，判斷該使用者是否對指定資源擁有 read 或 write 權限。
使用 @SetMetadata('permission', 'read') 與 Reflector 來指定需求。
- Interceptor：
實作 LoggingInterceptor，記錄 API 被呼叫的時間、使用者、檔案 ID 與操作類型。
所有檔案操作皆須經過此記錄。

前端:
有一個簡單的vue3頁面讓我們可以查詢使用者的檔案權限，並把以上API功能綁到UI上面。
問答題：
請說明 Middleware、Guard、Interceptor 在執行流程中的順序。
使用者擁有許多檔案，若要查詢「哪些檔案我擁有讀權限」，如何設計 SQL 查詢來避免 N+1 問題？
在分散式架構下，檔案權限如何同步或快取才能保證效能與一致性？

加分題 :
=> 在後端加入自動化測試。



## 問題統整： Task Lists
1. API: 上傳檔案
    - [POST] /files
2. API: 列出所有有權限的檔案
    - [GET] /files
3. API: 下載檔案
    - [GET] /files/:id
4. API: 刪除檔案
    - [DELETE] /files/:id
5. API: 設定檔案權限
    - [POST] /files/:id/permissions

6. Create Database (Done)
    - Users
    - Files
    - User-Permissions

7. Add Logging Interceptor
    - record API requested time, user, file id, operation type

8. Add Guards
    - PermissionsGuard
    - UserGuard

9. Vue3 Frontend
    -  bind those 5 API to UI

10. Explain the Process of Middleware, Guard, Interceptor (Half)


    Client Request --> Middleware --> Guard --> Interceptor --> Controller --> Interceptor --> Response


[Middleware] : Middleware 能access客戶端傳送過來的request與response的object，並執行特定的操作如變更，中斷，或繼續往下傳遞。
[Guard] : Guard 的唯一責任為確認客戶端發送的請求會不會被後面的路徑執行處理，例如權限控制，role check等。會被稱為authorization
[Interceptor] : Interceptor則是能bind extra logic，轉換或修改response，也可以完全override特定的功能，如loggingInterceptor。



12. 使用者擁有許多檔案，若要查詢「哪些檔案我擁有讀權限」，如何設計 SQL 查詢來避免 N+1 問題？ (Done)
- N+1 問題：
    - 每次查詢一個檔案時，都需要查詢一次權限然後需要查詢多次
    答：一般使用join table的方式能避免N+1問題
    這邊設計的方式為user + user_permission + files
    
    當查詢user在讀取檔案的權限上，基本上需要關聯到全體tables
    解法1：
    1. 開始先查詢user的權限
    ```
    select user_id, file_id from user_permission where user_id = 'user_id' AND user_permissions.can_read = TRUE;
    ```
    2. 然後再用前面拿到的file_id去查詢file的相關資料
    ```
    select * from files f where f.id = 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1';
    ```
    
    但是，這樣就會出現n+1的問題。

    最優解：
    同時集合查詢多個table （join）
    ```
    select file_id,filename,can_read from user_permissions u 
    left join files f on u.file_id = f.id
    where u.user_id = 'user_id'
    ;
    ```



13. 在分散式架構下，檔案權限如何同步或快取才能保證效能與一致性？

## Step 1: To create a nestjs project
```
npx @nestjs/cli new
```

## Step 2: Enter to the directory created

```
npm run start:dev
```
This line of command will start a hot reload for NestJs project.



## Step 3: Create Database
```
-- 1. Users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL
);

-- 4. Files
CREATE TABLE files (
    id UUID PRIMARY KEY,
    filename TEXT NOT NULL,
    owner_id UUID NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. User-level file permissions
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    file_id UUID NOT NULL,
    can_read BOOLEAN DEFAULT FALSE,
    can_write BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    UNIQUE (user_id, file_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);


```