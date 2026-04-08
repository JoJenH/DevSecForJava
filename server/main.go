package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
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

func createProxy(target string) *httputil.ReverseProxy {
	targetURL, err := url.Parse(target)
	if err != nil {
		return nil
	}
	return httputil.NewSingleHostReverseProxy(targetURL)
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
		dataPath = filepath.Join(execDir, "data")
	}

	distPath := os.Getenv("DIST_PATH")
	if distPath == "" {
		distPath = filepath.Join(execDir, "dist")
	}

	javaAddr := os.Getenv("JAVA_SERVICE_ADDR")
	if javaAddr == "" {
		javaAddr = "http://localhost:8081"
	}

	javaFixedAddr := os.Getenv("JAVA_FIXED_SERVICE_ADDR")
	if javaFixedAddr == "" {
		javaFixedAddr = "http://localhost:8082"
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

	api.GET("/categories", HandleListCategories(store))
	api.GET("/categories/:name", HandleGetCategory(store))

	edit := api.Group("/edit")
	edit.Use(AuthMiddleware)

	edit.POST("/categories", HandleCreateCategory(store))
	edit.PUT("/categories/:name", HandleUpdateCategory(store))
	edit.DELETE("/categories/:name", HandleDeleteCategory(store))

	vulProxy := createProxy(javaAddr)
	e.Any("/vul/*", echo.WrapHandler(vulProxy))
	e.GET("/vul", echo.WrapHandler(vulProxy))

	vulFixedProxy := createProxy(javaFixedAddr)
	e.Any("/vul/*/fixed", echo.WrapHandler(vulFixedProxy))

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
	} else if addr[0] != ':' {
		addr = ":" + addr
	}
	fmt.Printf("🚀 Server starting on %s\n", addr)
	fmt.Printf("   Data: %s\n", dataPath)
	fmt.Printf("   Dist: %s\n", distPath)
	fmt.Printf("   Java: %s\n", javaAddr)
	fmt.Printf("   Java Fixed: %s\n", javaFixedAddr)
	e.Logger.Fatal(e.Start(addr))
}
