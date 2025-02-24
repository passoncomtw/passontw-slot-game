package interfaces

type CreateUserRequest struct {
	Name           string  `json:"name" binding:"required,min=1,max=20" example:"testdemo001"`
	Phone          string  `json:"phone" binding:"required,min=1,max=20" example:"0987654321"`
	Password       string  `json:"password" binding:"required,min=6,max=50" example:"a12345678"`
	InitialBalance float64 `json:"initial_balance,omitempty" example:"1000.00"`
}

type CreateUserResponse struct {
	ID               int     `json:"id" example:"1"`
	Name             string  `json:"name" example:"testdemo001"`
	Phone            string  `json:"phone" example:"0987654321"`
	AvailableBalance float64 `json:"available_balance" example:"1000.00"`
	FrozenBalance    float64 `json:"frozen_balance" example:"0.00"`
}
