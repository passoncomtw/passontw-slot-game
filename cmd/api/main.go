package main

import (
	"passontw-slot-game/docs"
	"passontw-slot-game/internal/config"
	"passontw-slot-game/internal/handler"
	"passontw-slot-game/internal/pkg/database"
	"passontw-slot-game/internal/pkg/logger"
	"passontw-slot-game/internal/service"

	_ "passontw-slot-game/docs" // 導入 swagger docs

	"go.uber.org/fx"
)

// @title           Passontw Slot Game API
// @version         1.0
// @description     This is a sample server.
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @BasePath  /
func main() {
	// 從環境變數中獲取 API_HOST
	apiHost := config.GetEnv("API_HOST", "localhost:3000")
	docs.SwaggerInfo.Host = apiHost

	app := fx.New(
		fx.Provide(
			config.LoadEnv,
			config.NewConfig,
			logger.NewLogger,
			database.NewDatabase,
			service.NewHelloService,
			fx.Annotate(
				service.NewUserService,
				fx.As(new(service.UserService)),
			),
			handler.NewHelloHandler,
			handler.NewAuthHandler,
			handler.NewUserHandler,
			handler.NewRouter,
		),
		fx.Invoke(handler.StartServer),
	)

	app.Run()
}
