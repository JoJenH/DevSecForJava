package main

import (
	"bufio"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func LoadFromMarkdown(path string) (VulnerabilityData, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return VulnerabilityData{Categories: []VulnerabilityCategory{}}, nil
		}
		return VulnerabilityData{}, fmt.Errorf("failed to read file: %w", err)
	}

	vulnData := parseMarkdown(string(data))
	return vulnData, nil
}

func parseMarkdown(content string) VulnerabilityData {
	data := VulnerabilityData{Categories: []VulnerabilityCategory{}}
	scanner := bufio.NewScanner(strings.NewReader(content))

	var currentCategory *VulnerabilityCategory
	var currentItem *VulnerabilityItem
	var currentField string
	var fieldLines []string

	for scanner.Scan() {
		line := scanner.Text()

		if strings.HasPrefix(line, "# ") {
			if currentItem != nil && currentCategory != nil {
				saveItemField(currentItem, currentField, fieldLines)
				currentCategory.Items = append(currentCategory.Items, *currentItem)
				currentItem = nil
			}
			if currentCategory != nil {
				data.Categories = append(data.Categories, *currentCategory)
			}

			currentCategory = &VulnerabilityCategory{
				ID:    generateID(strings.TrimPrefix(line, "# ")),
				Name:  strings.TrimPrefix(line, "# "),
				Items: []VulnerabilityItem{},
			}
			currentField = ""
			fieldLines = nil
			continue
		}

		if strings.HasPrefix(line, "## ") {
			if currentItem != nil && currentCategory != nil {
				saveItemField(currentItem, currentField, fieldLines)
				currentCategory.Items = append(currentCategory.Items, *currentItem)
			}
			if currentCategory == nil {
				return data
			}
			currentItem = &VulnerabilityItem{
				ID:   generateID(strings.TrimPrefix(line, "## ")),
				Name: strings.TrimPrefix(line, "## "),
			}
			currentField = ""
			fieldLines = nil
			continue
		}

		if strings.HasPrefix(line, "### ") {
			if currentItem != nil && currentField != "" {
				saveItemField(currentItem, currentField, fieldLines)
			}
			currentField = strings.TrimPrefix(line, "### ")
			fieldLines = nil
			continue
		}

		if strings.TrimSpace(line) == "---" {
			if currentItem != nil && currentField != "" {
				saveItemField(currentItem, currentField, fieldLines)
			}
			currentField = ""
			fieldLines = nil
			continue
		}

		if currentItem != nil && currentField != "" {
			fieldLines = append(fieldLines, line)
		}
	}

	if currentItem != nil && currentCategory != nil {
		saveItemField(currentItem, currentField, fieldLines)
		currentCategory.Items = append(currentCategory.Items, *currentItem)
	}
	if currentCategory != nil {
		data.Categories = append(data.Categories, *currentCategory)
	}

	return data
}

func saveItemField(item *VulnerabilityItem, field string, lines []string) {
	if item == nil || field == "" {
		return
	}
	content := strings.TrimSpace(strings.Join(lines, "\n"))

	switch field {
	case "描述":
		item.Description = content
	case "漏洞代码":
		item.VulnerableCode = content
	case "修复代码":
		item.FixedCode = content
	case "审计要点":
		item.AuditPoints = parseListContent(lines)
	case "修复要点":
		item.FixPoints = parseListContent(lines)
	case "POC":
		item.POC = content
	}
}

func parseListContent(lines []string) []string {
	var items []string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		line = strings.TrimPrefix(line, "- ")
		line = strings.TrimPrefix(line, "* ")
		line = strings.TrimPrefix(line, "+ ")
		for i := 1; i <= 20; i++ {
			line = strings.TrimPrefix(line, fmt.Sprintf("%d. ", i))
		}
		if line != "" {
			items = append(items, line)
		}
	}
	return items
}

func generateID(name string) string {
	h := sha256.Sum256([]byte(name))
	return hex.EncodeToString(h[:8])
}

func SaveToMarkdown(path string, data VulnerabilityData) error {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return err
	}

	dir := filepath.Dir(absPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	md := serializeToMarkdown(data)
	return os.WriteFile(absPath, []byte(md), 0644)
}

func serializeToMarkdown(data VulnerabilityData) string {
	var sb strings.Builder

	for _, cat := range data.Categories {
		sb.WriteString(fmt.Sprintf("# %s\n\n", cat.Name))

		for _, item := range cat.Items {
			sb.WriteString(fmt.Sprintf("## %s\n\n", item.Name))

			if item.Description != "" {
				sb.WriteString(fmt.Sprintf("### 描述\n\n%s\n\n", item.Description))
			}

			if item.VulnerableCode != "" {
				sb.WriteString("### 漏洞代码\n\n```\n")
				sb.WriteString(item.VulnerableCode)
				sb.WriteString("\n```\n\n")
			}

			if item.FixedCode != "" {
				sb.WriteString("### 修复代码\n\n```\n")
				sb.WriteString(item.FixedCode)
				sb.WriteString("\n```\n\n")
			}

			if len(item.AuditPoints) > 0 {
				sb.WriteString("### 审计要点\n\n")
				for _, point := range item.AuditPoints {
					sb.WriteString(fmt.Sprintf("- %s\n", point))
				}
				sb.WriteString("\n")
			}

			if len(item.FixPoints) > 0 {
				sb.WriteString("### 修复要点\n\n")
				for _, point := range item.FixPoints {
					sb.WriteString(fmt.Sprintf("- %s\n", point))
				}
				sb.WriteString("\n")
			}

			if item.POC != "" {
				sb.WriteString(fmt.Sprintf("### POC\n\n%s\n\n", item.POC))
			}

			sb.WriteString("---\n\n")
		}
	}

	return sb.String()
}
