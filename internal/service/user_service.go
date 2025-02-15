package service

import (
	"passontw-slot-game/internal/domain/entity"

	"gorm.io/gorm"
)

type UserService interface {
	CreateUser(name, phone, password string) (*entity.User, error)
	GetUsers(page, pageSize int) ([]entity.User, int64, error)
}

type userService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) UserService {
	return &userService{
		db: db,
	}
}

func (s *userService) CreateUser(name, phone, password string) (*entity.User, error) {
	user := &entity.User{
		Name:     name,
		Phone:    phone,
		Password: password,
	}

	if err := s.db.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func (s *userService) GetUsers(page, pageSize int) ([]entity.User, int64, error) {
	var users []entity.User
	var total int64

	// 獲取總數
	if err := s.db.Model(&entity.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 計算偏移量
	offset := (page - 1) * pageSize

	// 查詢用戶列表
	if err := s.db.Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}
