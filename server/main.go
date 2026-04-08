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

	editToken := os.Getenv("EDIT_TOKEN")
	if editToken == "" {
		b := make([]byte, 16)
		rand.Read(b)
		editToken = hex.EncodeToString(b)
		fmt.Printf("🔑 Generated edit token: %s\n", editToken)
		fmt.Println("   Set EDIT_TOKEN env variable to use a custom token.")
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

	api.POST("/auth/login", HandleLogin(editToken))
	api.GET("/auth/check", HandleAuthCheck())
	api.GET("/data", HandleGetData(store))
	api.GET("/export/yaml", HandleExportYAML(store))

	edit := api.Group("/edit")
	edit.Use(AuthMiddleware)

	edit.POST("/categories", HandleCreateCategory(store))
	edit.PUT("/categories/:categoryId", HandleUpdateCategory(store))
	edit.DELETE("/categories/:categoryId", HandleDeleteCategory(store))
	edit.POST("/categories/:categoryId/items", HandleCreateItem(store))
	edit.PUT("/categories/:categoryId/items/:itemId", HandleUpdateItem(store))
	edit.DELETE("/categories/:categoryId/items/:itemId", HandleDeleteItem(store))
	edit.POST("/import/yaml", HandleImportYAML(store))

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
