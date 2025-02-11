package logger

type Logger struct{}

func NewLogger() *Logger {
	return &Logger{}
}

func (l *Logger) Info(msg string) {
	println("[INFO]", msg)
}
