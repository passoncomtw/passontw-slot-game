package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Code    int         `json:"code"`            // 狀態碼
	Message string      `json:"message"`         // 訊息
	Data    interface{} `json:"data,omitempty"`  // 數據
	Error   string      `json:"error,omitempty"` // 錯誤信息
}

type PageResponse struct {
	List       interface{} `json:"list"`        // 數據列表
	Total      int64       `json:"total"`       // 總數
	Page       int         `json:"page"`        // 當前頁
	PageSize   int         `json:"page_size"`   // 每頁大小
	TotalPages int         `json:"total_pages"` // 總頁數
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    http.StatusOK,
		Message: "success",
		Data:    data,
	})
}

func Error(c *gin.Context, code int, message string) {
	c.JSON(code, Response{
		Code:    code,
		Message: message,
	})
}

func ValidationError(c *gin.Context, errors map[string]string) {
	c.JSON(http.StatusBadRequest, Response{
		Code:    http.StatusBadRequest,
		Message: "validation error",
		Error:   "Invalid input parameters",
		Data:    errors,
	})
}

func PagedResponse(c *gin.Context, list interface{}, total int64, page, pageSize int) {
	totalPages := (int(total) + pageSize - 1) / pageSize

	c.JSON(http.StatusOK, Response{
		Code:    http.StatusOK,
		Message: "success",
		Data: PageResponse{
			List:       list,
			Total:      total,
			Page:       page,
			PageSize:   pageSize,
			TotalPages: totalPages,
		},
	})
}

func ServerError(c *gin.Context, err error) {
	c.JSON(http.StatusInternalServerError, Response{
		Code:    http.StatusInternalServerError,
		Message: "internal server error",
		Error:   err.Error(),
	})
}

func Unauthorized(c *gin.Context) {
	c.JSON(http.StatusUnauthorized, Response{
		Code:    http.StatusUnauthorized,
		Message: "unauthorized",
	})
}
