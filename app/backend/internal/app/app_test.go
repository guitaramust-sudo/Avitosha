package app

import (
	"context"
	"testing"
	"time"
)

func TestRunStopsWhenContextIsCanceled(t *testing.T) {
	t.Setenv("APP_ENV", "test")
	t.Setenv("HTTP_ADDR", "127.0.0.1:0")
	t.Setenv("LOG_LEVEL", "error")
	t.Setenv("SHUTDOWN_TIMEOUT", "2s")

	ctx, cancel := context.WithCancel(context.Background())
	errCh := make(chan error, 1)

	go func() {
		errCh <- Run(ctx)
	}()

	time.Sleep(100 * time.Millisecond)
	cancel()

	select {
	case err := <-errCh:
		if err != nil {
			t.Fatalf("Run() error = %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("Run() did not stop after context cancellation")
	}
}
