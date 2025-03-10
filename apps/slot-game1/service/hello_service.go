package service

type HelloService interface {
	GetGreeting() string
}

type helloService struct{}

func NewHelloService() HelloService {
	return &helloService{}
}

func (s *helloService) GetGreeting() string {
	return "Hello, World!!!"
}
