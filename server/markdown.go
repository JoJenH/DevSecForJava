package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/text"
)

func ImportFromMarkdown(content string) (VulnerabilityData, error) {
	data := parseMarkdownWithGoldmark(content)
	return data, nil
}

func ExportToMarkdown(data VulnerabilityData) string {
	return serializeToMarkdown(data)
}

func parseMarkdownWithGoldmark(content string) VulnerabilityData {
	data := VulnerabilityData{Categories: []VulnerabilityCategory{}}

	source := []byte(content)
	reader := text.NewReader(source)
	md := goldmark.DefaultParser()
	root := md.Parse(reader)

	var currentCategory *VulnerabilityCategory
	var currentItem *VulnerabilityItem
	var currentField string
	var inFieldContent bool
	var fieldContent strings.Builder

	ast.Walk(root, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering {
			return ast.WalkContinue, nil
		}

		switch node := n.(type) {
		case *ast.Heading:
			text := getTextContent(node, source)
			switch node.Level {
			case 1: // Category
				if currentItem != nil && currentCategory != nil {
					currentCategory.Items = append(currentCategory.Items, *currentItem)
				}
				if currentCategory != nil {
					data.Categories = append(data.Categories, *currentCategory)
				}
				currentCategory = &VulnerabilityCategory{
					ID:    generateID(text),
					Name:  text,
					Items: []VulnerabilityItem{},
				}
				currentItem = nil
				currentField = ""
				inFieldContent = false
				fieldContent.Reset()
			case 2: // Item
				if currentItem != nil && currentCategory != nil {
					currentCategory.Items = append(currentCategory.Items, *currentItem)
				}
				if currentCategory != nil {
					currentItem = &VulnerabilityItem{
						ID:   generateID(text),
						Name: text,
					}
				}
				currentField = ""
				inFieldContent = false
				fieldContent.Reset()
			case 3: // Field name
				// Save previous field content if any
				if currentItem != nil && currentField != "" && fieldContent.Len() > 0 {
					saveFieldToItem(currentItem, currentField, fieldContent.String())
				}
				currentField = text
				inFieldContent = true
				fieldContent.Reset()
			}

		case *ast.FencedCodeBlock:
			if currentItem != nil && inFieldContent {
				code := getCodeBlockContent(node, source)
				if fieldContent.Len() > 0 {
					fieldContent.WriteString("\n")
				}
				fieldContent.WriteString(code)
			}

		case *ast.Paragraph:
			if currentItem != nil && inFieldContent {
				text := getTextContent(node, source)
				if fieldContent.Len() > 0 {
					fieldContent.WriteString("\n")
				}
				fieldContent.WriteString(text)
			}

		case *ast.List:
			if currentItem != nil && inFieldContent {
				// For lists, we need to handle them specially for audit/fix points
				items := getListItems(node, source)
				if currentField == "审计要点" || currentField == "修复要点" {
					// Save directly as array
					saveListFieldToItem(currentItem, currentField, items)
					currentField = "" // Reset to avoid double saving
					fieldContent.Reset()
					inFieldContent = false
				} else {
					// For other fields, just append as text
					for _, item := range items {
						if fieldContent.Len() > 0 {
							fieldContent.WriteString("\n")
						}
						fieldContent.WriteString("- " + item)
					}
				}
			}

		case *ast.ThematicBreak:
			// Item separator
			if currentItem != nil && currentCategory != nil {
				if currentField != "" && fieldContent.Len() > 0 {
					saveFieldToItem(currentItem, currentField, fieldContent.String())
				}
				currentCategory.Items = append(currentCategory.Items, *currentItem)
				currentItem = nil
				currentField = ""
				inFieldContent = false
				fieldContent.Reset()
			}
		}

		return ast.WalkContinue, nil
	})

	// Save last item and category
	if currentItem != nil && currentCategory != nil {
		if currentField != "" && fieldContent.Len() > 0 {
			saveFieldToItem(currentItem, currentField, fieldContent.String())
		}
		currentCategory.Items = append(currentCategory.Items, *currentItem)
	}
	if currentCategory != nil {
		data.Categories = append(data.Categories, *currentCategory)
	}

	return data
}

func getTextContent(node ast.Node, source []byte) string {
	var buf bytes.Buffer
	getTextContentRecursive(node, source, &buf)
	return strings.TrimSpace(buf.String())
}

func getTextContentRecursive(node ast.Node, source []byte, buf *bytes.Buffer) {
	for child := node.FirstChild(); child != nil; child = child.NextSibling() {
		switch n := child.(type) {
		case *ast.Text:
			buf.Write(n.Value(source))
		case *ast.String:
			buf.Write(n.Value)
		default:
			// Recursively get text from child nodes (for TextBlock, etc.)
			getTextContentRecursive(child, source, buf)
		}
	}
}

func getCodeBlockContent(node *ast.FencedCodeBlock, source []byte) string {
	var buf bytes.Buffer
	for i := 0; i < node.Lines().Len(); i++ {
		line := node.Lines().At(i)
		buf.Write(line.Value(source))
	}
	return strings.TrimSuffix(buf.String(), "\n")
}

func getListItems(node *ast.List, source []byte) []string {
	var items []string
	for child := node.FirstChild(); child != nil; child = child.NextSibling() {
		if listItem, ok := child.(*ast.ListItem); ok {
			itemText := getTextContent(listItem, source)
			if itemText != "" {
				items = append(items, itemText)
			}
		}
	}
	return items
}

func saveFieldToItem(item *VulnerabilityItem, field, content string) {
	content = strings.TrimSpace(content)
	switch field {
	case "描述":
		item.Description = content
	case "漏洞代码":
		item.VulnerableCode = content
	case "修复代码":
		item.FixedCode = content
	case "审计要点":
		item.AuditPoints = parseListContent(content)
	case "修复要点":
		item.FixPoints = parseListContent(content)
	case "POC":
		item.POC = content
	}
}

func saveListFieldToItem(item *VulnerabilityItem, field string, items []string) {
	switch field {
	case "审计要点":
		item.AuditPoints = items
	case "修复要点":
		item.FixPoints = items
	}
}

func parseListContent(content string) []string {
	var items []string
	lines := strings.Split(content, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		line = strings.TrimPrefix(line, "- ")
		line = strings.TrimPrefix(line, "* ")
		line = strings.TrimPrefix(line, "+ ")
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

// getCodeFence returns the appropriate fence marker for code content
// It counts the maximum consecutive backticks in the content and returns
// a fence with more backticks than that
func getCodeFence(content string) string {
	maxBackticks := 0
	currentBackticks := 0

	for _, ch := range content {
		if ch == '`' {
			currentBackticks++
			if currentBackticks > maxBackticks {
				maxBackticks = currentBackticks
			}
		} else {
			currentBackticks = 0
		}
	}

	// Need at least 3 backticks, or more than the content has
	fenceLen := maxBackticks + 1
	if fenceLen < 3 {
		fenceLen = 3
	}

	return strings.Repeat("`", fenceLen)
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
				fence := getCodeFence(item.VulnerableCode)
				sb.WriteString(fmt.Sprintf("### 漏洞代码\n\n%sjava\n", fence))
				sb.WriteString(item.VulnerableCode)
				sb.WriteString(fmt.Sprintf("\n%s\n\n", fence))
			}

			if item.FixedCode != "" {
				fence := getCodeFence(item.FixedCode)
				sb.WriteString(fmt.Sprintf("### 修复代码\n\n%sjava\n", fence))
				sb.WriteString(item.FixedCode)
				sb.WriteString(fmt.Sprintf("\n%s\n\n", fence))
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
