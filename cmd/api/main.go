package main

import (
	"passontw-slot-game/internal/config"
	"passontw-slot-game/internal/handler"
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

// @host      localhost:8080
// @BasePath  /api/v1
func main() {
	app := fx.New(
		fx.Provide(
			config.NewConfig,
			logger.NewLogger,
			service.NewHelloService,
			handler.NewHelloHandler,
			handler.NewRouter,
		),
		fx.Invoke(handler.StartServer),
	)

	app.Run()
}
