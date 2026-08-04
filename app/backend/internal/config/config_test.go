package config

import (
	"strings"
	"testing"
	"time"
)

func TestLoadFromEnv(t *testing.T) {
	t.Parallel()

	env := map[string]string{
		"APP_ENV":          "test",
		"HTTP_ADDR":        "127.0.0.1:8080",
		"DATABASE_URL":     "postgres://postgres:postgres@localhost:5432/avitosha?sslmode=disable",
		"LOG_LEVEL":        "debug",
		"SHUTDOWN_TIMEOUT": "3s",
	}

	cfg, err := LoadFromEnv(mapGetter(env))
	if err != nil {
		t.Fatalf("LoadFromEnv() error = %v", err)
	}

	if cfg.AppEnv != AppEnvTest {
		t.Fatalf("AppEnv = %q, want %q", cfg.AppEnv, AppEnvTest)
	}
	if cfg.HTTPAddr != "127.0.0.1:8080" {
		t.Fatalf("HTTPAddr = %q", cfg.HTTPAddr)
	}
	if cfg.DatabaseURL == "" {
		t.Fatal("DatabaseURL is empty")
	}
	if cfg.LogLevel != LogLevelDebug {
		t.Fatalf("LogLevel = %q, want %q", cfg.LogLevel, LogLevelDebug)
	}
	if cfg.ShutdownTimeout != 3*time.Second {
		t.Fatalf("ShutdownTimeout = %s, want 3s", cfg.ShutdownTimeout)
	}
}

func TestLoadFromEnvUsesDefaults(t *testing.T) {
	t.Parallel()

	cfg, err := LoadFromEnv(mapGetter(map[string]string{
		"HTTP_ADDR":    "127.0.0.1:8080",
		"DATABASE_URL": "postgres://postgres:postgres@localhost:5432/avitosha?sslmode=disable",
	}))
	if err != nil {
		t.Fatalf("LoadFromEnv() error = %v", err)
	}

	if cfg.AppEnv != AppEnvDev {
		t.Fatalf("AppEnv = %q, want %q", cfg.AppEnv, AppEnvDev)
	}
	if cfg.LogLevel != LogLevelInfo {
		t.Fatalf("LogLevel = %q, want %q", cfg.LogLevel, LogLevelInfo)
	}
	if cfg.ShutdownTimeout != 5*time.Second {
		t.Fatalf("ShutdownTimeout = %s, want 5s", cfg.ShutdownTimeout)
	}
}

func TestLoadFromEnvRequiresHTTPAddr(t *testing.T) {
	t.Parallel()

	_, err := LoadFromEnv(mapGetter(map[string]string{}))
	if err == nil {
		t.Fatal("LoadFromEnv() error = nil, want error")
	}
	if !strings.Contains(err.Error(), "HTTP_ADDR") {
		t.Fatalf("error = %q, want HTTP_ADDR", err)
	}
}

func TestLoadFromEnvRejectsInvalidLogLevel(t *testing.T) {
	t.Parallel()

	_, err := LoadFromEnv(mapGetter(map[string]string{
		"HTTP_ADDR":    "127.0.0.1:8080",
		"DATABASE_URL": "postgres://postgres:postgres@localhost:5432/avitosha?sslmode=disable",
		"LOG_LEVEL":    "verbose",
	}))
	if err == nil {
		t.Fatal("LoadFromEnv() error = nil, want error")
	}
	if !strings.Contains(err.Error(), "LOG_LEVEL") {
		t.Fatalf("error = %q, want LOG_LEVEL", err)
	}
}

func TestLoadFromEnvRequiresDatabaseURL(t *testing.T) {
	t.Parallel()

	_, err := LoadFromEnv(mapGetter(map[string]string{
		"HTTP_ADDR": "127.0.0.1:8080",
	}))
	if err == nil {
		t.Fatal("LoadFromEnv() error = nil, want error")
	}
	if !strings.Contains(err.Error(), "DATABASE_URL") {
		t.Fatalf("error = %q, want DATABASE_URL", err)
	}
}

func mapGetter(values map[string]string) func(string) string {
	return func(key string) string {
		return values[key]
	}
}
