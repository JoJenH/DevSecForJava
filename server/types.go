package main

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