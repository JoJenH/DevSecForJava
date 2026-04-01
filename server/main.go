package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type VulnerabilityItem struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	ShortName      string   `json:"shortName"`
	Description    string   `json:"description"`
	VulnerableCode string   `json:"vulnerableCode"`
	FixedCode      string   `json:"fixedCode"`
	AuditPoints    []string `json:"auditPoints"`
	FixPoints      []string `json:"fixPoints"`
	POC            string   `json:"poc"`
}

type VulnerabilityCategory struct {
	ID    string              `json:"id"`
	Name  string              `json:"name"`
	Items []VulnerabilityItem `json:"items"`
}

type VulnerabilityData struct {
	Categories []VulnerabilityCategory `json:"categories"`
}

type ItemUpdateRequest struct {
	Name           string   `json:"name"`
	ShortName      string   `json:"shortName"`
	Description    string   `json:"description"`
	VulnerableCode string   `json:"vulnerableCode"`
	FixedCode      string   `json:"fixedCode"`
	AuditPoints    []string `json:"auditPoints"`
	FixPoints      []string `json:"fixPoints"`
	POC            string   `json:"poc"`
}

type CategoryCreateRequest struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type CategoryUpdateRequest struct {
	Name string `json:"name"`
}

type ItemCreateRequest struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	ShortName      string   `json:"shortName"`
	Description    string   `json:"description"`
	VulnerableCode string   `json:"vulnerableCode"`
	FixedCode      string   `json:"fixedCode"`
	AuditPoints    []string `json:"auditPoints"`
	FixPoints      []string `json:"fixPoints"`
	POC            string   `json:"poc"`
}

type LoginRequest struct {
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

type Store struct {
	mu   sync.RWMutex
	data VulnerabilityData
	path string
}

func NewStore(dataPath string) (*Store, error) {
	s := &Store{path: dataPath}
	if err := s.load(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	absPath, err := filepath.Abs(s.path)
	if err != nil {
		return err
	}

	data, err := os.ReadFile(absPath)
	if err != nil {
		if os.IsNotExist(err) {
			s.data = VulnerabilityData{Categories: []VulnerabilityCategory{}}
			return nil
		}
		return err
	}

	if err := json.Unmarshal(data, &s.data); err != nil {
		return err
	}
	return nil
}

func (s *Store) save() error {
	absPath, err := filepath.Abs(s.path)
	if err != nil {
		return err
	}

	dir := filepath.Dir(absPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(s.data, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(absPath, data, 0644)
}

func (s *Store) GetAll() VulnerabilityData {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data
}

func (s *Store) CreateCategory(req CategoryCreateRequest) (*VulnerabilityCategory, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, cat := range s.data.Categories {
		if cat.ID == req.ID {
			return nil, fmt.Errorf("category already exists")
		}
	}

	newCat := VulnerabilityCategory{
		ID:    req.ID,
		Name:  req.Name,
		Items: []VulnerabilityItem{},
	}
	s.data.Categories = append(s.data.Categories, newCat)

	if err := s.save(); err != nil {
		return nil, err
	}
	return &newCat, nil
}

func (s *Store) UpdateCategory(categoryID string, req CategoryUpdateRequest) (*VulnerabilityCategory, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.data.Categories {
		if s.data.Categories[i].ID == categoryID {
			s.data.Categories[i].Name = req.Name
			cat := s.data.Categories[i]
			if err := s.save(); err != nil {
				return nil, err
			}
			return &cat, nil
		}
	}
	return nil, fmt.Errorf("category not found")
}

func (s *Store) DeleteCategory(categoryID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, cat := range s.data.Categories {
		if cat.ID == categoryID {
			s.data.Categories = append(s.data.Categories[:i], s.data.Categories[i+1:]...)
			return s.save()
		}
	}
	return fmt.Errorf("category not found")
}

func (s *Store) CreateItem(categoryID string, req ItemCreateRequest) (*VulnerabilityItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.data.Categories {
		if s.data.Categories[i].ID == categoryID {
			for _, item := range s.data.Categories[i].Items {
				if item.ID == req.ID {
					return nil, fmt.Errorf("item already exists")
				}
			}
			newItem := VulnerabilityItem{
				ID:             req.ID,
				Name:           req.Name,
				ShortName:      req.ShortName,
				Description:    req.Description,
				VulnerableCode: req.VulnerableCode,
				FixedCode:      req.FixedCode,
				AuditPoints:    req.AuditPoints,
				FixPoints:      req.FixPoints,
				POC:            req.POC,
			}
			s.data.Categories[i].Items = append(s.data.Categories[i].Items, newItem)
			if err := s.save(); err != nil {
				return nil, err
			}
			return &newItem, nil
		}
	}
	return nil, fmt.Errorf("category not found")
}

func (s *Store) UpdateItem(categoryID, itemID string, req ItemUpdateRequest) (*VulnerabilityItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.data.Categories {
		if s.data.Categories[i].ID == categoryID {
			for j := range s.data.Categories[i].Items {
				if s.data.Categories[i].Items[j].ID == itemID {
					item := &s.data.Categories[i].Items[j]
					item.Name = req.Name
					item.ShortName = req.ShortName
					item.Description = req.Description
					item.VulnerableCode = req.VulnerableCode
					item.FixedCode = req.FixedCode
					item.AuditPoints = req.AuditPoints
					item.FixPoints = req.FixPoints
					item.POC = req.POC
					if err := s.save(); err != nil {
						return nil, err
					}
					return item, nil
				}
			}
			return nil, fmt.Errorf("item not found")
		}
	}
	return nil, fmt.Errorf("category not found")
}

func (s *Store) DeleteItem(categoryID, itemID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.data.Categories {
		if s.data.Categories[i].ID == categoryID {
			items := s.data.Categories[i].Items
			for j, item := range items {
				if item.ID == itemID {
					s.data.Categories[i].Items = append(items[:j], items[j+1:]...)
					return s.save()
				}
			}
			return fmt.Errorf("item not found")
		}
	}
	return fmt.Errorf("category not found")
}

var jwtSecret []byte

func initJWT() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		b := make([]byte, 32)
		rand.Read(b)
		secret = hex.EncodeToString(b)
		fmt.Printf("🔑 Generated JWT secret\n")
		fmt.Println("   Set JWT_SECRET env variable to use a custom secret.")
	}
	jwtSecret = []byte(secret)
}

func generateToken() (string, error) {
	claims := jwt.MapClaims{
		"exp": time.Now().Add(24 * time.Hour).Unix(),
		"iat": time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func validateToken(tokenString string) bool {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return false
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return false
	}

	exp, ok := claims["exp"].(float64)
	if !ok {
		return false
	}

	return time.Now().Unix() < int64(exp)
}

func authMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		authHeader := c.Request().Header.Get("Authorization")
		if authHeader == "" {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "missing authorization header"})
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid authorization format"})
		}

		token := parts[1]
		if !validateToken(token) {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid or expired token"})
		}

		c.Set("token", token)
		return next(c)
	}
}

func spaFallback(fs http.FileSystem) echo.HandlerFunc {
	indexFile, err := fs.Open("index.html")
	if err != nil {
		return nil
	}
	defer indexFile.Close()

	indexBytes, err := io.ReadAll(indexFile)
	if err != nil {
		return nil
	}

	return func(c echo.Context) error {
		c.Response().Header().Set("Content-Type", "text/html; charset=utf-8")
		c.Response().WriteHeader(http.StatusOK)
		c.Response().Write(indexBytes)
		return nil
	}
}

func main() {
	execPath, err := os.Executable()
	if err != nil {
		execPath = "."
	}
	execDir := filepath.Dir(execPath)
	if filepath.Base(execDir) == "server" {
		execDir = filepath.Dir(execDir)
	}

	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminPassword == "" {
		b := make([]byte, 16)
		rand.Read(b)
		adminPassword = hex.EncodeToString(b)
		fmt.Printf("🔑 Generated admin password: %s\n", adminPassword)
		fmt.Println("   Set ADMIN_PASSWORD env variable to use a custom password.")
	}

	dataPath := os.Getenv("DATA_PATH")
	if dataPath == "" {
		dataPath = filepath.Join(execDir, "data", "vulnerabilities.json")
	}

	distPath := os.Getenv("DIST_PATH")
	if distPath == "" {
		distPath = filepath.Join(execDir, "dist")
	}

	store, err := NewStore(dataPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to initialize store: %v\n", err)
		os.Exit(1)
	}

	initJWT()

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	api := e.Group("/api")

	api.POST("/auth/login", func(c echo.Context) error {
		var req LoginRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
		}
		if req.Password != adminPassword {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid password"})
		}
		token, err := generateToken()
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to generate token"})
		}
		return c.JSON(http.StatusOK, LoginResponse{Token: token})
	})

	api.GET("/auth/check", func(c echo.Context) error {
		authHeader := c.Request().Header.Get("Authorization")
		if authHeader == "" {
			return c.JSON(http.StatusOK, map[string]bool{"authenticated": false})
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.JSON(http.StatusOK, map[string]bool{"authenticated": false})
		}
		valid := validateToken(parts[1])
		return c.JSON(http.StatusOK, map[string]bool{"authenticated": valid})
	})

	api.GET("/data", func(c echo.Context) error {
		return c.JSON(http.StatusOK, store.GetAll())
	})

	admin := api.Group("")
	admin.Use(authMiddleware)

	admin.POST("/categories", func(c echo.Context) error {
		var req CategoryCreateRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		if req.ID == "" || req.Name == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "id and name are required"})
		}
		cat, err := store.CreateCategory(req)
		if err != nil {
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusCreated, cat)
	})

	admin.PUT("/categories/:categoryId", func(c echo.Context) error {
		var req CategoryUpdateRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		cat, err := store.UpdateCategory(c.Param("categoryId"), req)
		if err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, cat)
	})

	admin.DELETE("/categories/:categoryId", func(c echo.Context) error {
		if err := store.DeleteCategory(c.Param("categoryId")); err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.NoContent(http.StatusNoContent)
	})

	admin.POST("/categories/:categoryId/items", func(c echo.Context) error {
		var req ItemCreateRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		if req.ID == "" || req.Name == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "id and name are required"})
		}
		item, err := store.CreateItem(c.Param("categoryId"), req)
		if err != nil {
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusCreated, item)
	})

	admin.PUT("/categories/:categoryId/items/:itemId", func(c echo.Context) error {
		var req ItemUpdateRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		item, err := store.UpdateItem(c.Param("categoryId"), c.Param("itemId"), req)
		if err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, item)
	})

	admin.DELETE("/categories/:categoryId/items/:itemId", func(c echo.Context) error {
		if err := store.DeleteItem(c.Param("categoryId"), c.Param("itemId")); err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.NoContent(http.StatusNoContent)
	})

	distDir := http.Dir(distPath)

	e.GET("/assets/*", echo.WrapHandler(http.StripPrefix("/", http.FileServer(distDir))))
	e.GET("/favicon.svg", echo.WrapHandler(http.FileServer(distDir)))
	e.GET("/icons.svg", echo.WrapHandler(http.FileServer(distDir)))

	fallback := spaFallback(distDir)
	if fallback == nil {
		fmt.Fprintf(os.Stderr, "Warning: dist/index.html not found, SPA fallback disabled\n")
	} else {
		e.GET("/*", fallback)
	}

	addr := os.Getenv("PORT")
	if addr == "" {
		addr = ":8080"
	}
	fmt.Printf("🚀 Server starting on %s\n", addr)
	fmt.Printf("   Data: %s\n", dataPath)
	fmt.Printf("   Dist: %s\n", distPath)
	e.Logger.Fatal(e.Start(addr))
}
