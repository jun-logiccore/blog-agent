# Output Format

## Enhanced Output Format

Generated blog posts now include comprehensive frontmatter and inline images:

```markdown
---
title: "How to Build Sustainable Habits That Actually Stick"
cover_image: "https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg"
tags: ["sustainability", "habits", "lifestyle", "productivity"]
category: "lifestyle"
date: "2024-01-15"
---

Building sustainable habits is one of the most impactful ways to create lasting change...

![Relevant Image](https://images.pexels.com/photos/789012/pexels-photo-789012.jpeg)

_Photo by [Photographer Name](https://www.pexels.com/@photographer) on [Pexels](https://www.pexels.com/photo/789012/)_

More content continues...
```

## New Features

### 🎯 **Diverse Content Strategy**

- **Audience Development**: Content that attracts readers beyond existing customers
- **Thought Leadership**: Industry insights and trend analysis
- **Educational Value**: How-to guides and tutorials that provide genuine help
- **SEO Optimization**: Broader topic coverage for better search visibility
- **Content Calendar**: Natural mix of content types for sustained engagement

### 🏷️ **Smart Metadata Generation**

- **Context-Aware Tags**: Tags that match the content type (educational, industry, lifestyle, etc.)
- **Varied Categories**: Beyond just "business" - includes education, industry-insights, how-to, productivity, etc.
- **SEO-Friendly**: Tags and categories optimized for content discovery

### 📷 **Inline Images with Attribution**

- **100% Pexels Images**: All images are guaranteed to be valid Pexels photos
- **Smart Image Placement**: Images are strategically placed throughout the content
- **Pexels Attribution**: Proper credit with photographer name and links
- **Contextual Images**: AI-generated search queries for relevant stock photos
- **Graceful Image Handling**: Posts continue without images if Pexels service fails
- **Image Validation**: Multiple validation layers ensure image authenticity

### 📝 **Enhanced Content Generation**

- **Adaptive Tone**: Adjusts writing style based on content type (company voice vs. educational vs. industry expert)
- **Value-First Approach**: Content provides genuine value whether readers are customers or not
- **SEO-Friendly**: Broader topic coverage improves search engine visibility

## Image Quality Assurance

### Strict Validation Process

1. **API Response Validation**: Ensures Pexels API returns valid photo data
2. **URL Verification**: Confirms all image URLs are from pexels.com domain
3. **HTTPS Enforcement**: Only secure image URLs are accepted
4. **Attribution Validation**: Verifies photographer and attribution URLs
5. **Pre-Save Validation**: Final check before saving any blog post

### Error Handling for Images

- **No Placeholder Images**: Never uses generic placeholder images
- **Graceful Degradation**: Skips posts if no valid cover image is found
- **Optional Inline Images**: Continues without inline images if none are found
- **Detailed Logging**: Reports image search results and validation status
