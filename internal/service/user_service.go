package service

import (
	"errors"
	"passontw-slot-game/internal/config"
	"passontw-slot-game/internal/domain/entity"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService interface {
	CreateUser(params CreateUserParams) (*entity.User, error)
	GetUsers(page, pageSize int) ([]entity.User, int64, error)
	Login(phone, password string) (*entity.User, string, error)
}

type CreateUserParams struct {
	Name           string
	Phone          string
	Password       string
	InitialBalance float64
}

type userService struct {
	db     *gorm.DB
	config *config.Config
}

func NewUserService(db *gorm.DB, config *config.Config) UserService {
	return &userService{
		db:     db,
		config: config,
	}
}

func (s *userService) CreateUser(params CreateUserParams) (*entity.User, error) {
	var user *entity.User

	err := s.db.Transaction(func(tx *gorm.DB) error {
		var existingUser entity.User
		if err := tx.Where("phone = ?", params.Phone).First(&existingUser).Error; err == nil {
			return errors.New("phone number already exists")
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		hashPassword, err := bcrypt.GenerateFromPassword([]byte(params.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		newUser := &entity.User{
			Name:             params.Name,
			Phone:            params.Phone,
			Password:         string(hashPassword),
			AvailableBalance: params.InitialBalance,
			FrozenBalance:    0,
		}

		if err := tx.Create(newUser).Error; err != nil {
			return err
		}

		if params.InitialBalance > 0 {
			balanceRecord := &entity.BalanceRecord{
				UserID:        newUser.ID,
				Type:          entity.BalanceOperationAdd,
				Amount:        params.InitialBalance,
				BeforeBalance: 0,
				AfterBalance:  params.InitialBalance,
				BeforeFrozen:  0,
				AfterFrozen:   0,
				Description:   "Initial balance",
				Operator:      "SYSTEM",
				ReferenceID:   "INITIAL_" + time.Now().Format("20060102150405"),
				Remark:        entity.JSON{"type": "initial_balance"},
			}

			if err := tx.Create(balanceRecord).Error; err != nil {
				return err
			}
		}

		user = newUser
		return nil
	})

	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *userService) GetUsers(page, pageSize int) ([]entity.User, int64, error) {
	var users []entity.User
	var total int64

	if err := s.db.Model(&entity.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize

	if err := s.db.Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (s *userService) Login(phone, password string) (*entity.User, string, error) {
	var user entity.User

	if err := s.db.Where("phone = ?", phone).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", errors.New("user not found")
		}
		return nil, "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, "", errors.New("invalid password")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"name": user.Name,
		"exp":  time.Now().Add(time.Hour * 24).Unix(), // 24小時過期
	})

	tokenString, err := token.SignedString([]byte(s.config.JWT.Secret))
	if err != nil {
		return nil, "", err
	}

	user.Password = ""

	return &user, tokenString, nil
}
