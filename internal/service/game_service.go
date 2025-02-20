package service

import (
	"math/rand"
	"passontw-slot-game/internal/domain"
	"passontw-slot-game/internal/domain/models"
	"time"
)

type Generator struct {
	symbols []domain.SymbolInfo
	rng     *rand.Rand
}

type GameService interface {
	GetRamdomSpin() string
	GenerateBoard() models.Board
	GenerateBoardWithBias() models.Board
}

type gameService struct {
	generator *Generator
}

func NewGameService() GameService {
	return &gameService{
		generator: NewGenerator(),
	}
}

func NewGenerator() *Generator {
	return &Generator{
		symbols: domain.GetSymbolList(),
		rng:     rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

func (s *gameService) GetRamdomSpin() string {
	return "Random Spin Result"
}

func (s *gameService) GenerateBoard() models.Board {
	return s.generator.GenerateBoard()
}

func (s *gameService) GenerateBoardWithBias() models.Board {
	return s.generator.GenerateBoardWithBias()
}

func (g *Generator) GenerateBoard() models.Board {
	var board models.Board
	totalWeight := 0
	for _, symbol := range g.symbols {
		totalWeight += symbol.Weight
	}

	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			weight := g.rng.Intn(totalWeight)
			currentWeight := 0
			for _, symbol := range g.symbols {
				currentWeight += symbol.Weight
				if weight < currentWeight {
					board[i][j] = symbol.Symbol
					break
				}
			}
		}
	}
	return board
}

func (g *Generator) GenerateBoardWithBias() models.Board {
	var board models.Board

	mainSymbol := g.symbols[g.rng.Intn(len(g.symbols))].Symbol
	lineType := g.rng.Intn(8)

	switch {
	case lineType < 3:
		row := lineType
		for j := 0; j < 3; j++ {
			board[row][j] = mainSymbol
		}
	case lineType < 6:
		col := lineType - 3
		for i := 0; i < 3; i++ {
			board[i][col] = mainSymbol
		}
	case lineType == 6:
		for i := 0; i < 3; i++ {
			board[i][i] = mainSymbol
		}
	case lineType == 7:
		for i := 0; i < 3; i++ {
			board[i][2-i] = mainSymbol
		}
	}

	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if board[i][j] == 0 {
				board[i][j] = g.randomSymbol()
			}
		}
	}
	return board
}

func (g *Generator) randomSymbol() domain.Symbol {
	totalWeight := 0
	for _, symbol := range g.symbols {
		totalWeight += symbol.Weight
	}

	weight := g.rng.Intn(totalWeight)
	currentWeight := 0
	for _, symbol := range g.symbols {
		currentWeight += symbol.Weight
		if weight < currentWeight {
			return symbol.Symbol
		}
	}
	return g.symbols[0].Symbol
}
