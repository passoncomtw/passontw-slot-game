-- AI 老虎機遊戲後台管理系統資料庫初始化結構
-- 建立於 PostgreSQL 15+
-- 資深 DBA 設計，包含效能優化與管理功能

BEGIN;

-- 確保已安裝必要擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- 用於SQL性能監控

-- 設定時區為亞洲/台北
SET TIMEZONE TO 'Asia/Taipei';

--------------------------------------------------
-- 管理員相關表格
--------------------------------------------------

-- 創建管理員角色與權限
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'operator', 'viewer');

-- 管理員資料表
CREATE TABLE admin_users (
    admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role admin_role NOT NULL DEFAULT 'operator',
    avatar_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(45),
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL,
    CONSTRAINT proper_email CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);

-- 管理員權限表
CREATE TABLE admin_permissions (
    permission_id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 角色權限關聯表
CREATE TABLE admin_role_permissions (
    role admin_role NOT NULL,
    permission_id INT NOT NULL REFERENCES admin_permissions(permission_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL,
    PRIMARY KEY (role, permission_id)
);

-- 管理員會話表
CREATE TABLE admin_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admin_users(admin_id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);

--------------------------------------------------
-- 系統操作日誌
--------------------------------------------------

-- 創建操作類型
CREATE TYPE operation_type AS ENUM ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'other');

-- 創建操作對象類型
CREATE TYPE entity_type AS ENUM ('user', 'game', 'transaction', 'setting', 'admin', 'system');

-- 系統操作日誌表
CREATE TABLE admin_operation_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL,
    operation operation_type NOT NULL,
    entity_type entity_type NOT NULL,
    entity_id VARCHAR(100),
    description TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_data JSONB,
    response_data JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'success', -- 'success', 'failure', 'warning'
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_operation_logs_admin_id ON admin_operation_logs(admin_id);
CREATE INDEX idx_admin_operation_logs_operation ON admin_operation_logs(operation);
CREATE INDEX idx_admin_operation_logs_entity_type ON admin_operation_logs(entity_type);
CREATE INDEX idx_admin_operation_logs_executed_at ON admin_operation_logs(executed_at);

--------------------------------------------------
-- 系統設置與配置
--------------------------------------------------

-- 系統設置類別
CREATE TYPE setting_category AS ENUM ('general', 'security', 'notification', 'payment', 'game', 'api', 'other');

-- 系統設置表 (擴展前端的 system_settings 表)
CREATE TABLE admin_system_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    category setting_category NOT NULL DEFAULT 'general',
    is_public BOOLEAN NOT NULL DEFAULT FALSE, -- 是否對前端API公開
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

CREATE INDEX idx_admin_system_settings_category ON admin_system_settings(category);
CREATE INDEX idx_admin_system_settings_is_public ON admin_system_settings(is_public) WHERE is_public = TRUE;

--------------------------------------------------
-- 通知與公告系統
--------------------------------------------------

-- 通知狀態
CREATE TYPE notification_status AS ENUM ('draft', 'published', 'archived');

-- 通知目標對象
CREATE TYPE notification_target AS ENUM ('all_users', 'specific_users', 'vip_users', 'inactive_users', 'all_admins');

-- 系統公告表
CREATE TABLE admin_announcements (
    announcement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    status notification_status NOT NULL DEFAULT 'draft',
    target notification_target NOT NULL DEFAULT 'all_users',
    target_user_ids UUID[] DEFAULT NULL, -- 存儲特定用戶ID數組
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL,
    updated_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

CREATE INDEX idx_admin_announcements_status ON admin_announcements(status);
CREATE INDEX idx_admin_announcements_start_date ON admin_announcements(start_date);
CREATE INDEX idx_admin_announcements_end_date ON admin_announcements(end_date);
CREATE INDEX idx_admin_announcements_is_pinned ON admin_announcements(is_pinned) WHERE is_pinned = TRUE;

--------------------------------------------------
-- 報表和數據分析
--------------------------------------------------

-- 報表類型
CREATE TYPE report_type AS ENUM ('daily', 'weekly', 'monthly', 'custom');

-- 報表類別
CREATE TYPE report_category AS ENUM ('user', 'game', 'transaction', 'performance');

-- 報表總結表
CREATE TABLE admin_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type report_type NOT NULL,
    category report_category NOT NULL,
    parameters JSONB, -- 存儲報表參數
    result_data JSONB, -- 存儲報表結果
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generated_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL,
    is_scheduled BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_admin_reports_type ON admin_reports(type);
CREATE INDEX idx_admin_reports_category ON admin_reports(category);
CREATE INDEX idx_admin_reports_start_date ON admin_reports(start_date);
CREATE INDEX idx_admin_reports_generated_at ON admin_reports(generated_at);

-- 定期統計數據表 (用於儀表板)
CREATE TABLE admin_dashboard_stats (
    stat_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stat_date DATE NOT NULL,
    total_users INT NOT NULL DEFAULT 0,
    new_users INT NOT NULL DEFAULT 0,
    active_users INT NOT NULL DEFAULT 0,
    total_deposits DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_withdrawals DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_bets DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_wins DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    gross_gaming_revenue DECIMAL(15, 2) NOT NULL DEFAULT 0.00, -- 毛利 (投注-贏取)
    game_performance JSONB, -- 存儲各遊戲表現，如 {'game1': {'bets': 1000, 'wins': 800, 'unique_players': 50}}
    user_retention JSONB, -- 存儲用戶留存率，如 {'day1': 0.7, 'day7': 0.4, 'day30': 0.2}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_stat_date UNIQUE(stat_date)
);

CREATE INDEX idx_admin_dashboard_stats_stat_date ON admin_dashboard_stats(stat_date);

--------------------------------------------------
-- API管理與監控
--------------------------------------------------

-- API金鑰表
CREATE TABLE admin_api_keys (
    key_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL, -- 存儲許可權限
    rate_limit INT NOT NULL DEFAULT 1000, -- 每小時請求上限
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

CREATE INDEX idx_admin_api_keys_api_key ON admin_api_keys(api_key);
CREATE INDEX idx_admin_api_keys_is_active ON admin_api_keys(is_active) WHERE is_active = TRUE;

-- API請求日誌表
CREATE TABLE admin_api_request_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key UUID REFERENCES admin_api_keys(key_id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_params JSONB,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    response_code INT NOT NULL,
    response_time INT NOT NULL, -- 毫秒
    request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_api_request_logs_api_key ON admin_api_request_logs(api_key);
CREATE INDEX idx_admin_api_request_logs_endpoint ON admin_api_request_logs(endpoint);
CREATE INDEX idx_admin_api_request_logs_request_timestamp ON admin_api_request_logs(request_timestamp);

--------------------------------------------------
-- 遊戲管理擴展
--------------------------------------------------

-- 遊戲版本管理
CREATE TABLE admin_game_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    version_number VARCHAR(20) NOT NULL,
    change_log TEXT,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    assets_url VARCHAR(255),
    config JSONB, -- 存儲遊戲配置參數
    release_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL,
    CONSTRAINT unique_game_version UNIQUE(game_id, version_number)
);

CREATE INDEX idx_admin_game_versions_game_id ON admin_game_versions(game_id);
CREATE INDEX idx_admin_game_versions_is_active ON admin_game_versions(is_active) WHERE is_active = TRUE;

-- 遊戲維護計劃
CREATE TABLE admin_game_maintenance (
    maintenance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(game_id) ON DELETE CASCADE, -- NULL 表示全部遊戲
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

CREATE INDEX idx_admin_game_maintenance_game_id ON admin_game_maintenance(game_id);
CREATE INDEX idx_admin_game_maintenance_start_time ON admin_game_maintenance(start_time);
CREATE INDEX idx_admin_game_maintenance_end_time ON admin_game_maintenance(end_time);
CREATE INDEX idx_admin_game_maintenance_is_active ON admin_game_maintenance(is_active) WHERE is_active = TRUE;

--------------------------------------------------
-- 用戶管理擴展
--------------------------------------------------

-- 用戶黑名單
CREATE TABLE admin_user_blacklist (
    blacklist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    email VARCHAR(255),
    ip_address VARCHAR(45),
    device_id VARCHAR(255),
    reason TEXT NOT NULL,
    expires_at TIMESTAMPTZ, -- NULL表示永久
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL,
    CONSTRAINT at_least_one_identifier CHECK (
        user_id IS NOT NULL OR
        email IS NOT NULL OR
        ip_address IS NOT NULL OR
        device_id IS NOT NULL
    )
);

CREATE INDEX idx_admin_user_blacklist_user_id ON admin_user_blacklist(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_admin_user_blacklist_email ON admin_user_blacklist(email) WHERE email IS NOT NULL;
CREATE INDEX idx_admin_user_blacklist_ip_address ON admin_user_blacklist(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_admin_user_blacklist_device_id ON admin_user_blacklist(device_id) WHERE device_id IS NOT NULL;

-- 用戶備註表
CREATE TABLE admin_user_notes (
    note_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    is_important BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL,
    updated_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

CREATE INDEX idx_admin_user_notes_user_id ON admin_user_notes(user_id);
CREATE INDEX idx_admin_user_notes_is_important ON admin_user_notes(is_important) WHERE is_important = TRUE;

--------------------------------------------------
-- 交易管理擴展
--------------------------------------------------

-- 交易管控規則表
CREATE TABLE admin_transaction_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL, -- 'limit', 'flag', 'block'
    conditions JSONB NOT NULL, -- 規則條件，如 {'amount': {'gt': 10000}, 'type': 'withdraw'}
    actions JSONB NOT NULL, -- 執行動作，如 {'notify': ['admin'], 'require_approval': true}
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 0, -- 處理優先順序，數字越大越優先
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

CREATE INDEX idx_admin_transaction_rules_is_active ON admin_transaction_rules(is_active, priority) WHERE is_active = TRUE;

-- 交易審核表
CREATE TABLE admin_transaction_approvals (
    approval_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    rule_id UUID REFERENCES admin_transaction_rules(rule_id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_notes TEXT,
    reviewed_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_transaction_approvals_transaction_id ON admin_transaction_approvals(transaction_id);
CREATE INDEX idx_admin_transaction_approvals_status ON admin_transaction_approvals(status);
CREATE INDEX idx_admin_transaction_approvals_reviewed_by ON admin_transaction_approvals(reviewed_by) WHERE reviewed_by IS NOT NULL;

--------------------------------------------------
-- 自動觸發器
--------------------------------------------------

-- 自動更新 updated_at 時間戳的函數
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 管理員用戶表格更新時間戳觸發器
CREATE TRIGGER update_admin_users_timestamp
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 系統設置表格更新時間戳觸發器
CREATE TRIGGER update_admin_system_settings_timestamp
BEFORE UPDATE ON admin_system_settings
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 公告表格更新時間戳觸發器
CREATE TRIGGER update_admin_announcements_timestamp
BEFORE UPDATE ON admin_announcements
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 遊戲版本表格更新時間戳觸發器
CREATE TRIGGER update_admin_game_versions_timestamp
BEFORE UPDATE ON admin_game_versions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 遊戲維護表格更新時間戳觸發器
CREATE TRIGGER update_admin_game_maintenance_timestamp
BEFORE UPDATE ON admin_game_maintenance
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 用戶黑名單表格更新時間戳觸發器
CREATE TRIGGER update_admin_user_blacklist_timestamp
BEFORE UPDATE ON admin_user_blacklist
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 用戶備註表格更新時間戳觸發器
CREATE TRIGGER update_admin_user_notes_timestamp
BEFORE UPDATE ON admin_user_notes
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 交易規則表格更新時間戳觸發器
CREATE TRIGGER update_admin_transaction_rules_timestamp
BEFORE UPDATE ON admin_transaction_rules
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 儀表板統計數據表格更新時間戳觸發器
CREATE TRIGGER update_admin_dashboard_stats_timestamp
BEFORE UPDATE ON admin_dashboard_stats
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- API金鑰表更新時間戳觸發器
CREATE TRIGGER update_admin_api_keys_timestamp
BEFORE UPDATE ON admin_api_keys
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

--------------------------------------------------
-- 操作日誌記錄觸發器
--------------------------------------------------

-- 建立操作日誌記錄函數
CREATE OR REPLACE FUNCTION log_admin_operation()
RETURNS TRIGGER AS $$
DECLARE
    operation_type operation_type;
    entity_id_val VARCHAR(100);
BEGIN
    -- 確定操作類型
    IF TG_OP = 'INSERT' THEN
        operation_type := 'create';
    ELSIF TG_OP = 'UPDATE' THEN
        operation_type := 'update';
    ELSIF TG_OP = 'DELETE' THEN
        operation_type := 'delete';
    END IF;
    
    -- 獲取實體ID
    IF TG_TABLE_NAME = 'admin_users' THEN
        entity_id_val := COALESCE(OLD.admin_id::TEXT, NEW.admin_id::TEXT);
    ELSIF TG_TABLE_NAME = 'users' THEN
        entity_id_val := COALESCE(OLD.user_id::TEXT, NEW.user_id::TEXT);
    ELSIF TG_TABLE_NAME = 'games' THEN
        entity_id_val := COALESCE(OLD.game_id::TEXT, NEW.game_id::TEXT);
    ELSIF TG_TABLE_NAME = 'transactions' THEN
        entity_id_val := COALESCE(OLD.transaction_id::TEXT, NEW.transaction_id::TEXT);
    ELSIF TG_TABLE_NAME = 'admin_system_settings' THEN
        entity_id_val := COALESCE(OLD.setting_key, NEW.setting_key);
    ELSE
        entity_id_val := NULL;
    END IF;
    
    -- 記錄操作日誌
    INSERT INTO admin_operation_logs (
        admin_id,
        operation,
        entity_type,
        entity_id,
        description,
        request_data,
        response_data
    ) VALUES (
        CURRENT_SETTING('app.current_admin_id', TRUE)::UUID,
        operation_type,
        TG_TABLE_NAME::entity_type,
        entity_id_val,
        'Operation on ' || TG_TABLE_NAME || ' table',
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            ELSE to_jsonb(NEW)
        END,
        NULL
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------
-- 初始數據
--------------------------------------------------

-- 添加初始超級管理員
INSERT INTO admin_users (
    username,
    email,
    password_hash,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    'admin',
    'admin@example.com',
    crypt('admin123', gen_salt('bf')), -- bcrypt 加密的密碼，生產環境請使用強密碼
    '系統管理員',
    'super_admin',
    TRUE,
    NOW(),
    NOW()
);

-- 添加基本管理權限
INSERT INTO admin_permissions (permission_name, description) VALUES
('user.view', '查看用戶信息'),
('user.create', '創建新用戶'),
('user.update', '更新用戶信息'),
('user.delete', '刪除用戶'),
('game.view', '查看遊戲信息'),
('game.create', '創建新遊戲'),
('game.update', '更新遊戲信息'),
('game.delete', '刪除遊戲'),
('transaction.view', '查看交易記錄'),
('transaction.approve', '審核交易'),
('transaction.cancel', '取消交易'),
('report.view', '查看報表'),
('report.export', '導出報表'),
('settings.view', '查看系統設置'),
('settings.update', '更新系統設置'),
('admin.view', '查看管理員信息'),
('admin.create', '創建管理員'),
('admin.update', '更新管理員信息'),
('admin.delete', '刪除管理員'),
('api.manage', '管理API密鑰'),
('logs.view', '查看操作日誌');

-- 設置角色權限
-- 超級管理員
INSERT INTO admin_role_permissions (role, permission_id)
SELECT 'super_admin', permission_id FROM admin_permissions;

-- 管理員
INSERT INTO admin_role_permissions (role, permission_id)
SELECT 'admin', permission_id FROM admin_permissions
WHERE permission_name NOT IN ('admin.delete', 'settings.update');

-- 操作員
INSERT INTO admin_role_permissions (role, permission_id)
SELECT 'operator', permission_id FROM admin_permissions
WHERE permission_name IN (
    'user.view', 'user.update',
    'game.view',
    'transaction.view', 'transaction.approve',
    'report.view', 'report.export',
    'logs.view'
);

-- 觀察者
INSERT INTO admin_role_permissions (role, permission_id)
SELECT 'viewer', permission_id FROM admin_permissions
WHERE permission_name IN (
    'user.view',
    'game.view',
    'transaction.view',
    'report.view',
    'settings.view',
    'logs.view'
);

-- 基本系統設置
INSERT INTO admin_system_settings (setting_key, setting_value, category, is_public, description) VALUES
('site.name', '"AI 老虎機遊戲後台管理系統"', 'general', TRUE, '網站名稱'),
('site.logo', '"/assets/images/logo.png"', 'general', TRUE, '網站標誌'),
('security.password_policy', '{"min_length": 8, "require_numbers": true, "require_uppercase": true, "require_special": true}', 'security', FALSE, '密碼策略'),
('security.login_attempts', '5', 'security', FALSE, '登入錯誤嘗試次數'),
('security.lockout_duration', '30', 'security', FALSE, '帳戶鎖定時間(分鐘)'),
('notification.email_enabled', 'true', 'notification', FALSE, '是否啟用電子郵件通知'),
('payment.min_deposit', '100', 'payment', TRUE, '最低存款金額'),
('payment.max_withdraw', '50000', 'payment', TRUE, '最大提款金額'),
('payment.daily_withdraw_limit', '100000', 'payment', TRUE, '每日提款限額'),
('game.default_rtp', '96.5', 'game', FALSE, '預設遊戲返還率'),
('api.rate_limit', '1000', 'api', FALSE, 'API每小時請求限制');

-- 初始儀表板數據
INSERT INTO admin_dashboard_stats (
    stat_date,
    total_users,
    new_users,
    active_users,
    total_deposits,
    total_withdrawals,
    total_bets,
    total_wins,
    gross_gaming_revenue,
    game_performance,
    user_retention
) VALUES (
    CURRENT_DATE - INTERVAL '1 day',
    1000,
    50,
    350,
    500000.00,
    350000.00,
    1200000.00,
    1100000.00,
    100000.00,
    '{"幸運七": {"bets": 500000, "wins": 480000, "unique_players": 200}, "水果派對": {"bets": 300000, "wins": 270000, "unique_players": 150}, "金幣樂園": {"bets": 400000, "wins": 350000, "unique_players": 180}}',
    '{"day1": 0.8, "day7": 0.6, "day30": 0.4}'
);

COMMIT; 