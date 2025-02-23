package utils

import (
	"fmt"
	"sync"
	"time"
)

const (
	workerBits   uint8 = 10                        // 機器 ID 的位數
	sequenceBits uint8 = 12                        // 序列號的位數
	workerMax    int64 = -1 ^ (-1 << workerBits)   // 機器 ID 的最大值
	sequenceMask int64 = -1 ^ (-1 << sequenceBits) // 序列號掩碼
	timeShift    uint8 = workerBits + sequenceBits // 時間戳向左移位數
	workerShift  uint8 = sequenceBits              // 機器 ID 向左移位數
	epoch        int64 = 1577808000000             // 起始時間戳 (2020-01-01 00:00:00 UTC)
)

type IDGenerator interface {
	NextID() (int64, error)
}

type Snowflake struct {
	mu        sync.Mutex
	timestamp int64 // 上次生成 ID 的時間戳
	workerId  int64 // 機器 ID
	sequence  int64 // 序列號
}

var (
	instance *Snowflake
)

// 確保 Snowflake 實現了 IDGenerator 介面
var _ IDGenerator = (*Snowflake)(nil)

func InitSnowflake(workerId int64) error {
	var initErr error
	once.Do(func() {
		if workerId < 0 || workerId > workerMax {
			initErr = fmt.Errorf("worker ID must be between 0 and %d", workerMax)
			return
		}
		instance = &Snowflake{
			workerId:  workerId,
			timestamp: 0,
			sequence:  0,
		}
	})
	return initErr
}

func GetNextID() (int64, error) {
	if instance == nil {
		return 0, fmt.Errorf("snowflake not initialized")
	}
	return instance.NextID()
}

func (s *Snowflake) NextID() (int64, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UnixNano() / 1e6

	if now < s.timestamp {
		return 0, fmt.Errorf("clock moved backwards")
	}

	if now == s.timestamp {
		s.sequence = (s.sequence + 1) & sequenceMask
		if s.sequence == 0 {
			for now <= s.timestamp {
				now = time.Now().UnixNano() / 1e6
			}
		}
	} else {
		s.sequence = 0
	}

	s.timestamp = now

	id := ((now - epoch) << timeShift) |
		(s.workerId << workerShift) |
		s.sequence

	return id, nil
}

func ParseID(id int64) map[string]interface{} {
	timestamp := (id >> timeShift) + epoch
	workerId := (id >> workerShift) & workerMax
	sequence := id & sequenceMask

	t := time.Unix(timestamp/1000, (timestamp%1000)*1000000)

	return map[string]interface{}{
		"timestamp": t,
		"worker_id": workerId,
		"sequence":  sequence,
	}
}

func ValidateID(id int64) bool {
	if id <= 0 {
		return false
	}

	parsed := ParseID(id)

	timestamp := parsed["timestamp"].(time.Time)
	if timestamp.Before(time.Unix(epoch/1000, 0)) ||
		timestamp.After(time.Now().Add(time.Hour)) {
		return false
	}

	workerId := parsed["worker_id"].(int64)
	if workerId < 0 || workerId > workerMax {
		return false
	}

	sequence := parsed["sequence"].(int64)
	if sequence < 0 || sequence > sequenceMask {
		return false
	}

	return true
}
