package main

import (
	"context"
	"fmt"
	"os"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/app"
)

func main() {
	if err := app.Run(context.Background()); err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "api failed: %v\n", err)
		os.Exit(1)
	}
}
