package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

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
		dataPath = filepath.Join(execDir, "data", "vulnerabilities.yaml")
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

	InitJWT()

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	api := e.Group("/api")

	api.POST("/auth/login", HandleLogin(adminPassword))
	api.GET("/auth/check", HandleAuthCheck())
	api.GET("/data", HandleGetData(store))

	admin := api.Group("")
	admin.Use(AuthMiddleware)

	admin.POST("/categories", HandleCreateCategory(store))
	admin.PUT("/categories/:categoryId", HandleUpdateCategory(store))
	admin.DELETE("/categories/:categoryId", HandleDeleteCategory(store))
	admin.POST("/categories/:categoryId/items", HandleCreateItem(store))
	admin.PUT("/categories/:categoryId/items/:itemId", HandleUpdateItem(store))
	admin.DELETE("/categories/:categoryId/items/:itemId", HandleDeleteItem(store))
	admin.GET("/export/markdown", HandleExportMarkdown(store))
	admin.POST("/import/markdown", HandleImportMarkdown(store))

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
