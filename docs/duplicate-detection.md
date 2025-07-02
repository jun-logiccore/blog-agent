# Duplicate Detection

The agent automatically prevents duplicate content generation:

## 🔍 **Smart Detection Process**

1. **Scans Existing Posts**: Reads all `.md` files in the `posts/` directory
2. **Extracts Titles**: Parses frontmatter and H1 headings to get existing titles
3. **AI-Informed Generation**: Includes existing titles in the AI prompt to avoid similar topics
4. **Client-Side Filtering**: Additional similarity detection as a safety net
5. **Detailed Logging**: Reports duplicate detection results

## 🎯 **Detection Examples**

```
Existing: "The Future of Sustainable Packaging"

✅ Detected Duplicates:
- "The Future of Sustainable Packaging" (exact match)
- "Future of Sustainable Packaging Solutions" (80%+ similar)

✅ Allowed Variations:
- "The History of Sustainable Packaging" (different focus)
- "Sustainable Packaging Case Studies" (different approach)
```

## ⚙️ **How It Works**

- **Normalization**: Handles punctuation, capitalization, and spacing differences
- **Similarity Threshold**: Detects titles that are 80%+ similar in word content
- **Word Filtering**: Ignores common words (the, a, an, and, or, etc.)
- **Intelligent Matching**: Considers semantic similarity, not just exact matches

## 📊 **Logging Output**

```
ℹ️  Reading existing post titles to avoid duplicates...
ℹ️  Found 15 existing posts to avoid duplicating
ℹ️  Generated 87 blog ideas, 82 after duplicate filtering.
ℹ️  Filtered out 5 duplicate titles
``` 