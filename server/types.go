package main

type CategoryInfo struct {
	Name string `json:"name"`
}

type CategoryContent struct {
	Name    string `json:"name"`
	Content string `json:"content"`
}

type CategoryUpdateRequest struct {
	Content string `json:"content"`
}

type LoginRequest struct {
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
}
