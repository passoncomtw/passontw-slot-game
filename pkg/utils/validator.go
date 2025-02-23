package utils

import (
	"regexp"
	"unicode"
)

func ValidatePassword(password string) bool {
	var (
		hasMinLen = len(password) >= 8
		hasUpper  = false
		hasLower  = false
		hasNumber = false
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		}
	}

	return hasMinLen && hasUpper && hasLower && hasNumber
}

func ValidatePhone(phone string) bool {
	pattern := `^09[0-9]{8}$`
	matched, _ := regexp.MatchString(pattern, phone)
	return matched
}

func ValidateEmail(email string) bool {
	pattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	matched, _ := regexp.MatchString(pattern, email)
	return matched
}

func ValidateUsername(username string) bool {
	if len(username) < 3 || len(username) > 20 {
		return false
	}

	pattern := `^[a-zA-Z0-9_-]+$`
	matched, _ := regexp.MatchString(pattern, username)
	return matched
}

func ValidateAmount(amount float64) bool {
	return amount > 0 && amount <= 999999999.99
}
