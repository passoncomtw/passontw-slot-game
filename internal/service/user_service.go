package service

import (
	"passontw-slot-game/internal/domain/entity"

	"gorm.io/gorm"
)

type UserService interface {
	CreateUser(name, phone, password string) (*entity.User, error)
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
