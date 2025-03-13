package service

import (
	"errors"
	"passontw-slot-game/apps/auth-service/config"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username string `gorm:"uniqueIndex;not null" json:"username"`
	Password string `gorm:"not null" json:"-"`
	Email    string `gorm:"uniqueIndex;not null" json:"email"`
}

type UserService interface {
	CreateUser(params *CreateUserParams) (*User, error)
	GetUsers() ([]User, error)
	Login(username, password string) (string, error)
}

type CreateUserParams struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
}

type userService struct {
	db     *gorm.DB
	config *config.Config
}

func NewUserService(db *gorm.DB, config *config.Config) UserService {
	// 確保用戶表已創建
	// db.AutoMigrate(&User{})

	return &userService{
		db:     db,
		config: config,
	}
}

func (s *userService) CreateUser(params *CreateUserParams) (*User, error) {
	// 檢查用戶名是否已存在
	var existingUser User
	if err := s.db.Where("username = ?", params.Username).First(&existingUser).Error; err == nil {
		return nil, errors.New("用戶名已存在")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// 檢查郵箱是否已存在
	if err := s.db.Where("email = ?", params.Email).First(&existingUser).Error; err == nil {
		return nil, errors.New("郵箱已存在")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// 加密密碼
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(params.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 創建新用戶
	user := &User{
		Username: params.Username,
		Password: string(hashedPassword),
		Email:    params.Email,
	}

	if err := s.db.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func (s *userService) GetUsers() ([]User, error) {
	var users []User
	if err := s.db.Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (s *userService) Login(username, password string) (string, error) {
	// 查找用戶
	var user User
	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errors.New("用戶名或密碼錯誤")
		}
		return "", err
	}

	// 檢查密碼
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", errors.New("用戶名或密碼錯誤")
	}

	// 生成 JWT 令牌
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(s.config.JWT.ExpiresIn).Unix(),
	})

	// 簽名令牌
	signedToken, err := token.SignedString([]byte(s.config.JWT.Secret))
	if err != nil {
		return "", err
	}

	return signedToken, nil
}
