package service

import (
	"errors"
	"passontw-slot-game/internal/domain/entity"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService interface {
	CreateUser(name, phone, password string) (*entity.User, error)
	GetUsers(page, pageSize int) ([]entity.User, int64, error)
	Login(phone, password string) (*entity.User, string, error)
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

func (s *userService) Login(phone, password string) (*entity.User, string, error) {
	var user entity.User

	// 查找用戶
	if err := s.db.Where("phone = ?", phone).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", errors.New("user not found")
		}
		return nil, "", err
	}

	// 驗證密碼
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, "", errors.New("invalid password")
	}

	// 生成 JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"name": user.Name,
		"exp":  time.Now().Add(time.Hour * 24).Unix(), // 24小時過期
	})

	// 這裡使用一個簡單的密鑰，實際應用中應該使用環境變量或配置文件
	tokenString, err := token.SignedString([]byte("your-secret-key"))
	if err != nil {
		return nil, "", err
	}

	// 清理敏感資訊
	user.Password = ""

	return &user, tokenString, nil
}
