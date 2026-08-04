package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const refreshTokenEntropyBytes = 32

type JWTTokenProviderConfig struct {
	SigningKey []byte
	Issuer     string
	Audience   string
}

type JWTTokenProvider struct {
	signingKey []byte
	issuer     string
	audience   string
}

type accessTokenClaims struct {
	SessionID string `json:"sid"`
	jwt.RegisteredClaims
}

func NewJWTTokenProvider(cfg JWTTokenProviderConfig) (*JWTTokenProvider, error) {
	switch {
	case len(cfg.SigningKey) == 0:
		return nil, fmt.Errorf("signing key is required")
	case cfg.Issuer == "":
		return nil, fmt.Errorf("issuer is required")
	case cfg.Audience == "":
		return nil, fmt.Errorf("audience is required")
	}

	signingKey := append([]byte(nil), cfg.SigningKey...)

	return &JWTTokenProvider{
		signingKey: signingKey,
		issuer:     cfg.Issuer,
		audience:   cfg.Audience,
	}, nil
}

func (p *JWTTokenProvider) CreateAccessToken(userID, sessionID uuid.UUID, issuedAt, expiresAt time.Time) (string, error) {
	if userID == uuid.Nil {
		return "", fmt.Errorf("user id is required")
	}
	if sessionID == uuid.Nil {
		return "", fmt.Errorf("session id is required")
	}
	if !expiresAt.After(issuedAt) {
		return "", fmt.Errorf("expires at must be after issued at")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, accessTokenClaims{
		SessionID: sessionID.String(),
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    p.issuer,
			Audience:  jwt.ClaimStrings{p.audience},
			IssuedAt:  jwt.NewNumericDate(issuedAt),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	})

	signedToken, err := token.SignedString(p.signingKey)
	if err != nil {
		return "", fmt.Errorf("sign jwt access token: %w", err)
	}

	return signedToken, nil
}

func (p *JWTTokenProvider) CreateRefreshToken() (string, error) {
	randomBytes := make([]byte, refreshTokenEntropyBytes)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", fmt.Errorf("generate refresh token entropy: %w", err)
	}

	return base64.RawURLEncoding.EncodeToString(randomBytes), nil
}

func (p *JWTTokenProvider) HashRefreshToken(token string) []byte {
	hashSum := sha256.Sum256([]byte(token))
	hashedToken := make([]byte, sha256.Size)
	copy(hashedToken, hashSum[:])
	return hashedToken
}
