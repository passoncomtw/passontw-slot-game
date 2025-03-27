-- AI 老虎機遊戲資料庫初始化結構
-- 建立於 PostgreSQL 15+
-- 資深 DBA 設計，包含效能優化與正規化設計

BEGIN;

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 啟用密碼雜湊擴展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 設定時區為亞洲/台北
SET TIMEZONE TO 'Asia/Taipei';

-- 創建用戶角色與權限
CREATE TYPE user_role AS ENUM ('user', 'vip', 'admin');

-- 創建用戶驗證方式
CREATE TYPE auth_provider AS ENUM ('email', 'google', 'facebook', 'apple');

-- 創建交易類型
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdraw', 'bet', 'win', 'bonus', 'refund');

-- 創建遊戲類型
CREATE TYPE game_type AS ENUM ('slot', 'card', 'table', 'arcade');

--------------------------------------------------
-- 用戶管理相關表格
--------------------------------------------------

-- 用戶資料表
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    auth_provider auth_provider NOT NULL DEFAULT 'email',
    auth_provider_id VARCHAR(255),
    role user_role NOT NULL DEFAULT 'user',
    vip_level INT NOT NULL DEFAULT 0,
    points INT NOT NULL DEFAULT 0,
    avatar_url VARCHAR(255),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    CONSTRAINT proper_email CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- 為常用查詢建立索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_vip_level ON users(vip_level);

-- 用戶設定表
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    sound BOOLEAN NOT NULL DEFAULT TRUE,
    music BOOLEAN NOT NULL DEFAULT TRUE,
    vibration BOOLEAN NOT NULL DEFAULT FALSE,
    high_quality BOOLEAN NOT NULL DEFAULT TRUE,
    ai_assistant BOOLEAN NOT NULL DEFAULT TRUE,
    game_recommendation BOOLEAN NOT NULL DEFAULT TRUE,
    data_collection BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 用戶財務資料表
CREATE TABLE user_wallets (
    wallet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    total_deposit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_withdraw DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_bet DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_win DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);

-- 驗證碼表
CREATE TABLE verification_tokens (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'email_verification', 'password_reset', etc.
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);

-- 登入記錄表
CREATE TABLE login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    device_info VARCHAR(255),
    successful BOOLEAN NOT NULL,
    login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_history_user_id ON login_history(user_id);

--------------------------------------------------
-- 遊戲相關表格
--------------------------------------------------

-- 遊戲主表
CREATE TABLE games (
    game_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    game_type game_type NOT NULL,
    icon VARCHAR(255) NOT NULL,
    background_color VARCHAR(20) NOT NULL,
    rtp DECIMAL(5, 2) NOT NULL, -- Return To Player 百分比
    volatility VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high'
    min_bet DECIMAL(10, 2) NOT NULL,
    max_bet DECIMAL(10, 2) NOT NULL,
    features JSONB, -- 儲存遊戲特色如 {'free_spins': true, 'bonus_rounds': true}
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_new BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    release_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_games_title ON games(title);
CREATE INDEX idx_games_game_type ON games(game_type);
CREATE INDEX idx_games_is_featured ON games(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_games_is_new ON games(is_new) WHERE is_new = TRUE;

-- 遊戲評分表
CREATE TABLE game_ratings (
    rating_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating DECIMAL(3, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_game_rating UNIQUE(user_id, game_id)
);

CREATE INDEX idx_game_ratings_game_id ON game_ratings(game_id);
CREATE INDEX idx_game_ratings_user_id ON game_ratings(user_id);

-- 用戶遊戲偏好表
CREATE TABLE user_game_preferences (
    preference_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    play_count INT NOT NULL DEFAULT 0,
    last_played_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_game_preference UNIQUE(user_id, game_id)
);

CREATE INDEX idx_user_game_preferences_user_id ON user_game_preferences(user_id);
CREATE INDEX idx_user_game_preferences_game_id ON user_game_preferences(game_id);
CREATE INDEX idx_user_game_preferences_favorites ON user_game_preferences(user_id, is_favorite) WHERE is_favorite = TRUE;

-- 遊戲標籤表
CREATE TABLE game_tags (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 遊戲與標籤關聯表
CREATE TABLE game_tag_relations (
    game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES game_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, tag_id)
);

CREATE INDEX idx_game_tag_relations_game_id ON game_tag_relations(game_id);
CREATE INDEX idx_game_tag_relations_tag_id ON game_tag_relations(tag_id);

--------------------------------------------------
-- 遊戲紀錄與交易相關表格
--------------------------------------------------

-- 遊戲會話表
CREATE TABLE game_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    initial_balance DECIMAL(15, 2) NOT NULL,
    final_balance DECIMAL(15, 2),
    total_bets DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_wins DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    spin_count INT NOT NULL DEFAULT 0,
    win_count INT NOT NULL DEFAULT 0,
    device_info JSONB,
    ip_address VARCHAR(45)
);

CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_game_id ON game_sessions(game_id);
CREATE INDEX idx_game_sessions_start_time ON game_sessions(start_time);

-- 遊戲回合表 (每次旋轉)
CREATE TABLE game_rounds (
    round_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    bet_amount DECIMAL(15, 2) NOT NULL,
    win_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    multiplier DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    symbols JSONB NOT NULL, -- 記錄老虎機中出現的符號
    paylines JSONB, -- 記錄獲勝的線
    features_triggered JSONB, -- 如 {'free_spins': 10, 'bonus_round': true}
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_rounds_session_id ON game_rounds(session_id);
CREATE INDEX idx_game_rounds_user_id ON game_rounds(user_id);
CREATE INDEX idx_game_rounds_game_id ON game_rounds(game_id);
CREATE INDEX idx_game_rounds_created_at ON game_rounds(created_at);

-- 交易歷史表
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES user_wallets(wallet_id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    type transaction_type NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'cancelled'
    game_id UUID REFERENCES games(game_id) ON DELETE SET NULL,
    session_id UUID REFERENCES game_sessions(session_id) ON DELETE SET NULL,
    round_id UUID REFERENCES game_rounds(round_id) ON DELETE SET NULL,
    reference_id VARCHAR(255), -- 外部參考編號 (如支付平台的交易編號)
    description TEXT,
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_game_id ON transactions(game_id) WHERE game_id IS NOT NULL;
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

--------------------------------------------------
-- AI 分析與推薦相關表格
--------------------------------------------------

-- 用戶遊戲風格分析表
CREATE TABLE user_game_analysis (
    analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    risk_preference DECIMAL(5, 2) NOT NULL, -- 0-100，0為保守，100為激進
    avg_bet_size DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    avg_session_duration INT NOT NULL DEFAULT 0, -- 秒
    preferred_game_types JSONB, -- 如 {'slot': 0.7, 'card': 0.2, 'arcade': 0.1}
    preferred_features JSONB, -- 如 {'free_spins': 0.8, 'bonus_rounds': 0.6}
    playing_pattern JSONB, -- 如 {'morning': 0.2, 'evening': 0.7, 'night': 0.1}
    win_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- 贏率百分比
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_game_analysis_user_id ON user_game_analysis(user_id);

-- 遊戲推薦表
CREATE TABLE game_recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    match_score DECIMAL(5, 2) NOT NULL, -- 匹配分數 0-100
    reason JSONB, -- 推薦原因 {'risk_match': 0.9, 'feature_match': 0.8}
    is_shown BOOLEAN NOT NULL DEFAULT FALSE,
    is_clicked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_game_recommendation UNIQUE(user_id, game_id)
);

CREATE INDEX idx_game_recommendations_user_id ON game_recommendations(user_id);
CREATE INDEX idx_game_recommendations_game_id ON game_recommendations(game_id);
CREATE INDEX idx_game_recommendations_match_score ON game_recommendations(match_score DESC);

--------------------------------------------------
-- 排行榜相關表格
--------------------------------------------------

-- 排行榜類型
CREATE TYPE leaderboard_type AS ENUM ('winners', 'richest', 'active');

-- 排行榜表
CREATE TABLE leaderboards (
    leaderboard_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type leaderboard_type NOT NULL,
    period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_leaderboard_type_period UNIQUE(type, period, start_date)
);

CREATE INDEX idx_leaderboards_type_period ON leaderboards(type, period);

-- 排行榜項目表
CREATE TABLE leaderboard_entries (
    entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leaderboard_id UUID NOT NULL REFERENCES leaderboards(leaderboard_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rank INT NOT NULL,
    score DECIMAL(15, 2) NOT NULL, -- 對於不同類型的排行榜具有不同含義
    metadata JSONB, -- 額外資訊
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_leaderboard_user UNIQUE(leaderboard_id, user_id),
    CONSTRAINT unique_leaderboard_rank UNIQUE(leaderboard_id, rank)
);

CREATE INDEX idx_leaderboard_entries_leaderboard_id ON leaderboard_entries(leaderboard_id);
CREATE INDEX idx_leaderboard_entries_user_id ON leaderboard_entries(user_id);
CREATE INDEX idx_leaderboard_entries_rank ON leaderboard_entries(leaderboard_id, rank);

-- 排行榜獎勵表
CREATE TABLE leaderboard_rewards (
    reward_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leaderboard_id UUID NOT NULL REFERENCES leaderboards(leaderboard_id) ON DELETE CASCADE,
    rank_from INT NOT NULL,
    rank_to INT NOT NULL,
    cash_reward DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    points_reward INT NOT NULL DEFAULT 0,
    other_rewards JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT rank_range_valid CHECK (rank_from <= rank_to),
    CONSTRAINT unique_leaderboard_rank_range UNIQUE(leaderboard_id, rank_from, rank_to)
);

CREATE INDEX idx_leaderboard_rewards_leaderboard_id ON leaderboard_rewards(leaderboard_id);

--------------------------------------------------
-- 系統通知與消息相關表格
--------------------------------------------------

-- 通知類型
CREATE TYPE notification_type AS ENUM ('system', 'game', 'promotion', 'reward', 'achievement');

-- 通知表
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    action_url VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

--------------------------------------------------
-- 管理員與系統維護相關表格
--------------------------------------------------

-- 系統配置表
CREATE TABLE system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 審計日誌表
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

--------------------------------------------------
-- 觸發器
--------------------------------------------------

-- 自動更新 updated_at 時間戳的函數
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 用戶表格更新時間戳觸發器
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 用戶設定表格更新時間戳觸發器
CREATE TRIGGER update_user_settings_timestamp
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 用戶錢包表格更新時間戳觸發器
CREATE TRIGGER update_user_wallets_timestamp
BEFORE UPDATE ON user_wallets
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 遊戲表格更新時間戳觸發器
CREATE TRIGGER update_games_timestamp
BEFORE UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 遊戲評分表格更新時間戳觸發器
CREATE TRIGGER update_game_ratings_timestamp
BEFORE UPDATE ON game_ratings
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 用戶遊戲偏好表格更新時間戳觸發器
CREATE TRIGGER update_user_game_preferences_timestamp
BEFORE UPDATE ON user_game_preferences
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 交易表格更新時間戳觸發器
CREATE TRIGGER update_transactions_timestamp
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 用戶遊戲分析表格更新時間戳觸發器
CREATE TRIGGER update_user_game_analysis_timestamp
BEFORE UPDATE ON user_game_analysis
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 排行榜表格更新時間戳觸發器
CREATE TRIGGER update_leaderboards_timestamp
BEFORE UPDATE ON leaderboards
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 系統設定表格更新時間戳觸發器
CREATE TRIGGER update_system_settings_timestamp
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

--------------------------------------------------
-- 新增一些初始數據
--------------------------------------------------

-- 插入示範遊戲
INSERT INTO games (title, description, game_type, icon, background_color, rtp, volatility, min_bet, max_bet, features, is_featured, is_new)
VALUES 
('幸運七', '經典老虎機遊戲，有特殊的七倍符號獎勵和免費旋轉功能。', 'slot', 'diamond', '#6200EA', 96.5, 'medium', 1.00, 500.00, '{"free_spins": true, "bonus_rounds": true, "multipliers": true}', true, false),
('金幣樂園', '充滿金幣的刺激老虎機，大獎等著您來贏取！', 'slot', 'coins', '#B388FF', 95.8, 'medium', 0.50, 200.00, '{"free_spins": true, "bonus_rounds": false, "multipliers": true}', false, true),
('水果派對', '繽紛多彩的水果主題老虎機，獎勵豐厚。', 'slot', 'fire', '#F44336', 97.2, 'high', 2.00, 1000.00, '{"free_spins": true, "bonus_rounds": true, "multipliers": true}', true, false),
('翡翠寶石', '綠寶石主題的老虎機，擁有獨特的寶石收集系統。', 'slot', 'leaf', '#009688', 94.5, 'low', 1.00, 300.00, '{"free_spins": false, "bonus_rounds": true, "multipliers": false}', false, false),
('龍之財富', '東方龍主題老虎機，神秘且高風險高回報。', 'slot', 'dragon', '#FF5722', 93.5, 'high', 5.00, 2000.00, '{"free_spins": true, "bonus_rounds": true, "multipliers": true}', false, false),
('月光寶盒', '月亮主題的夢幻老虎機，有神秘寶盒獎勵。', 'slot', 'moon', '#3F51B5', 95.0, 'medium', 1.00, 500.00, '{"free_spins": true, "bonus_rounds": false, "multipliers": true}', false, false);

-- 插入遊戲標籤
INSERT INTO game_tags (name) VALUES 
('熱門'), ('新遊戲'), ('高獎金'), ('低投注額'), ('免費旋轉'), ('獎金遊戲'), ('乘數'), ('中等風險'), ('高風險'), ('低風險');

-- 建立遊戲與標籤的關聯
INSERT INTO game_tag_relations (game_id, tag_id)
SELECT g.game_id, t.tag_id
FROM games g, game_tags t
WHERE 
  (g.title = '幸運七' AND t.name IN ('熱門', '免費旋轉', '獎金遊戲', '乘數', '中等風險')) OR
  (g.title = '金幣樂園' AND t.name IN ('新遊戲', '免費旋轉', '乘數', '中等風險')) OR
  (g.title = '水果派對' AND t.name IN ('熱門', '高獎金', '免費旋轉', '獎金遊戲', '乘數', '高風險')) OR
  (g.title = '翡翠寶石' AND t.name IN ('獎金遊戲', '低風險')) OR
  (g.title = '龍之財富' AND t.name IN ('高獎金', '免費旋轉', '獎金遊戲', '乘數', '高風險')) OR
  (g.title = '月光寶盒' AND t.name IN ('免費旋轉', '乘數', '中等風險'));

COMMIT; 