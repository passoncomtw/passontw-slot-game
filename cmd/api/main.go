package main

import (
	"passontw-slot-game/internal/config"
	"passontw-slot-game/internal/handler"
	"passontw-slot-game/internal/pkg/logger"
	"passontw-slot-game/internal/service"

	"go.uber.org/fx"
)

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
