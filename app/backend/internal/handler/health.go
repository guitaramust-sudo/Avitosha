package handler

import (
	"encoding/json"
	"net/http"
)

type healthResponse struct {
	Status string `json:"status"`
}

func Live(w http.ResponseWriter, _ *http.Request) {
	writeHealth(w)
}

func Ready(w http.ResponseWriter, _ *http.Request) {
	writeHealth(w)
}

func writeHealth(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(healthResponse{Status: "ok"})
}
