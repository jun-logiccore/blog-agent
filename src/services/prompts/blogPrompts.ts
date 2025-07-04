export class BlogPrompts {
  static buildBlogIdeasPrompt(
    companyInstruction: string,
    existingTitles: string[] = []
  ): string {
    const existingTitlesText =
      existingTitles.length > 0
        ? `\n\nEXISTING TITLES TO AVOID:\n${existingTitles
            .map((title) => `- ${title}`)
            .join("\n")}`
        : "";

    return [
      `You are a creative content strategist for a blog associated with: "${companyInstruction}".`,
      "Generate 10-15 engaging, SEO-friendly blog post titles that would resonate with the target audience.",
      "",
      "REQUIREMENTS:",
      "- Titles should be compelling and click-worthy",
      "- Focus on topics that provide real value to readers",
      "- Include a mix of how-to guides, industry insights, and thought leadership",
      "- Use power words that drive engagement (ultimate, complete, essential, proven, etc.)",
      "- Ensure titles are unique and not similar to existing ones",
      "- Target comprehensive, detailed articles",
      "",
      "TITLE FORMATS TO INCLUDE:",
      "- 'The Complete Guide to [Topic]: Everything You Need to Know'",
      "- 'How to [Achieve Goal]: A Step-by-Step Guide'",
      "- '[Number] Proven Strategies for [Outcome]'",
      "- 'The Ultimate [Topic] Guide: [Year] Edition'",
      "- '[Industry] Trends You Can't Ignore in [Year]'",
      "",
      "CRITICAL: Return ONLY a JSON array of title strings, no markdown formatting, no code blocks, no other text.",
      'Example: ["Title 1", "Title 2", "Title 3"]',
      existingTitlesText,
    ].join("\n");
  }

  static buildBlogOutlinePrompt(
    title: string,
    companyInstruction: string
  ): string {
    return [
      `You are a professional content strategist creating a detailed outline for a blog post titled "${title}".`,
      `This is for a blog associated with a company described as: "${companyInstruction}".`,
      "",
      "OUTLINE REQUIREMENTS:",
      "- Create a comprehensive, detailed outline with 6-8 main sections",
      "- Each section should have 3-5 subsections",
      "- Include an engaging introduction and strong conclusion",
      "- Structure for a long-form, comprehensive article",
      "- Focus on providing deep value and actionable insights",
      "",
      "OUTLINE STRUCTURE:",
      "1. Introduction (hook, problem statement, what readers will learn)",
      "2. Main sections (6-8 sections with clear themes)",
      "3. Conclusion (summary, key takeaways, next steps)",
      "",
      "WRITING STYLE NOTES:",
      "- Plan for conversational, engaging content",
      "- Include personal anecdotes and examples",
      "- Use 'you' and 'we' to connect with readers",
      "- Include practical tips and actionable advice",
      "",
      "CRITICAL: Return ONLY a JSON object with this structure, no markdown formatting, no code blocks, no other text:",
      `{
        "title": "${title}",
        "introduction": "Brief description of the intro section",
        "sections": [
          {
            "title": "Section Title",
            "description": "What this section will cover",
            "subsections": [
              {
                "title": "Subsection Title",
                "description": "What this subsection will cover"
              }
            ]
          }
        ],
        "conclusion": "Brief description of the conclusion section"
      }`,
      "",
      "Make sure each section and subsection has clear, descriptive titles that indicate the value readers will get.",
      "Return ONLY the JSON object, no markdown, no code blocks, no other text.",
    ].join("\n");
  }

  static buildSectionExpansionPrompt(
    title: string,
    sectionTitle: string,
    sectionDescription: string,
    subsections: Array<{ title: string; description: string }>,
    companyInstruction: string
  ): string {
    const subsectionsText = subsections
      .map((sub) => `- ${sub.title}: ${sub.description}`)
      .join("\n");

    return [
      `You are a professional blogger expanding a section of a blog post titled "${title}".`,
      `This is for a blog associated with a company described as: "${companyInstruction}".`,
      "",
      `SECTION TO EXPAND:`,
      `Title: ${sectionTitle}`,
      `Description: ${sectionDescription}`,
      "",
      `SUBSECTIONS TO COVER:`,
      subsectionsText,
      "",
      "WRITING REQUIREMENTS:",
      "- Write a comprehensive, detailed section that thoroughly covers all subsections",
      "- Use a conversational, engaging tone that sounds like a real blogger",
      "- Write for humans, not search engines - be authentic and relatable",
      "- Include personal anecdotes, examples, and storytelling elements",
      "- Use 'I', 'we', 'you' to create connection with readers",
      "- Avoid academic or research paper language",
      "",
      "CONTENT STYLE:",
      "- Write like you're talking to a friend over coffee",
      "- Use contractions (don't, can't, won't, etc.)",
      "- Include rhetorical questions to engage readers",
      "- Use analogies and metaphors to explain complex concepts",
      "- Vary sentence length for natural flow",
      "- Include humor and personality where appropriate",
      "",
      "STRUCTURE:",
      "- Start with a brief introduction to the section",
      "- Cover each subsection thoroughly with clear transitions",
      "- Include practical examples and real-world applications",
      "- Address common pain points and objections",
      "- End with a smooth transition to the next section",
      "",
      "FORMATTING:",
      "- Use markdown formatting with clear headers (### for subsections)",
      "- Include bullet points and numbered lists for readability",
      "- Use bold and italic text for emphasis",
      "- Create natural paragraph breaks",
      "",
      "IMPORTANT: Do NOT include any images, image URLs, or image markdown syntax (![]) in the content.",
      "Do NOT create placeholder image links or fake URLs.",
      "Do NOT reference specific images or include any ![image]() syntax.",
      "Write the content in a way that allows for images to be inserted naturally by the system later.",
      "Focus purely on text content - images will be added separately by the system.",
      "",
      "EXTERNAL LINKS:",
      "- Include relevant external links to authoritative sources",
      "- Link to research papers, industry reports, and expert articles",
      "- Ensure all links are to reputable, reliable sources",
      "- Use descriptive link text that explains what the reader will find",
      "",
      "Write this section to be comprehensive and detailed. Don't worry about overall article length - focus on making this section valuable and thorough.",
      "Make this section engaging, informative, and actionable for readers.",
    ].join("\n");
  }

  static buildIntroductionPrompt(
    title: string,
    introductionDescription: string,
    companyInstruction: string
  ): string {
    return [
      `You are a professional blogger writing the introduction for a blog post titled "${title}".`,
      `This is for a blog associated with a company described as: "${companyInstruction}".`,
      "",
      `INTRODUCTION TO WRITE:`,
      `Description: ${introductionDescription}`,
      "",
      "INTRODUCTION REQUIREMENTS:",
      "- Start with a compelling hook that grabs attention",
      "- Include a brief personal story or relatable scenario",
      "- Clearly state the problem or challenge readers face",
      "- Explain what readers will learn and the value they'll get",
      "- Set expectations for the comprehensive content ahead",
      "- End with a smooth transition to the first main section",
      "",
      "WRITING STYLE:",
      "- Use a conversational, engaging tone",
      "- Write like you're talking to a friend",
      "- Use 'you' and 'we' to create connection",
      "- Include contractions and natural language",
      "- Make it personal and relatable",
      "",
      "FORMATTING:",
      "- Use markdown formatting",
      "- Create natural paragraph breaks",
      "- Use bold text for emphasis where appropriate",
      "",
      "IMPORTANT: Do NOT include any images, image URLs, or image markdown syntax (![]) in the content.",
      "Do NOT create placeholder image links or fake URLs.",
      "Do NOT reference specific images or include any ![image]() syntax.",
      "Focus purely on text content - images will be added separately by the system.",
      "",
      "Make this introduction compelling and engaging. It should hook readers and make them want to continue reading the entire article.",
    ].join("\n");
  }

  static buildConclusionPrompt(
    title: string,
    conclusionDescription: string,
    companyInstruction: string
  ): string {
    return [
      `You are a professional blogger writing the conclusion for a blog post titled "${title}".`,
      `This is for a blog associated with a company described as: "${companyInstruction}".`,
      "",
      `CONCLUSION TO WRITE:`,
      `Description: ${conclusionDescription}`,
      "",
      "CONCLUSION REQUIREMENTS:",
      "- Start with '## Conclusion' as the section header",
      "- Summarize the key points and insights from the article",
      "- Reinforce the main value proposition for readers",
      "- Provide actionable next steps or takeaways",
      "- End with an inspiring or motivational note",
      "- Include a call-to-action if appropriate",
      "",
      "WRITING STYLE:",
      "- Use a conversational, engaging tone",
      "- Write like you're wrapping up a conversation with a friend",
      "- Use 'you' and 'we' to maintain connection",
      "- Include contractions and natural language",
      "- Make it personal and encouraging",
      "",
      "FORMATTING:",
      "- Use markdown formatting with ## Conclusion as the header",
      "- Create natural paragraph breaks",
      "- Use bullet points for key takeaways if helpful",
      "",
      "IMPORTANT: Do NOT include any images, image URLs, or image markdown syntax (![]) in the content.",
      "Do NOT create placeholder image links or fake URLs.",
      "Do NOT reference specific images or include any ![image]() syntax.",
      "Focus purely on text content - images will be added separately by the system.",
      "",
      "Make this conclusion memorable and actionable. It should leave readers feeling informed, inspired, and ready to take action.",
    ].join("\n");
  }

  static buildBlogMetadataPrompt(
    title: string,
    companyInstruction: string
  ): string {
    return [
      `Generate metadata for a comprehensive, engaging blog post titled "${title}" for a blog associated with a company described as: "${companyInstruction}".`,
      "Analyze the title to determine the content type and generate appropriate metadata:",
      "- How-to guides & tutorials: Use instructional/tutorial tags and education/how-to categories",
      "- Industry insights & trends: Use industry-specific tags and trends/analysis categories",
      "- Thought leadership: Use business/strategy tags and business/leadership categories",
      "- Company insights: Use company/brand-related tags and business/company categories",
      "- Broader topics: Use broader interest tags and general categories",
      "",
      "CRITICAL: Return ONLY a JSON object with 'tags' (array of 4-6 relevant tags) and 'category' (single category string), no markdown formatting, no code blocks, no other text.",
      "Tags should be lowercase, single words or short phrases that accurately reflect the blog content.",
      "Categories can include: how-to, education, industry-insights, trends, business, technology, health, sustainability, finance, marketing, productivity, leadership, general, etc.",
      "Make tags and categories that would help with SEO and content discovery for blog content.",
      "",
      "Examples:",
      '- \'The Complete Guide to Building a Successful Remote Team\' → {"tags": ["remote-work", "team-building", "leadership", "productivity", "management"], "category": "how-to"}',
      '- \'10 Proven Marketing Strategies That Actually Work in 2024\' → {"tags": ["marketing", "strategies", "business-growth", "digital-marketing", "tips"], "category": "marketing"}',
      '- \'How to Create a Zero-Waste Lifestyle: A Practical Guide\' → {"tags": ["sustainability", "zero-waste", "lifestyle", "environment", "how-to"], "category": "how-to"}',
      "Return ONLY the JSON object, no markdown, no code blocks, no other text.",
    ].join("\n");
  }

  static buildImageQueriesPrompt(title: string, content: string): string {
    const contentPreview = content.substring(0, 500);
    return [
      `Based on this engaging blog post title "${title}" and content preview: "${contentPreview}",`,
      "generate 3-4 search queries for finding relevant GENERIC STOCK PHOTOS that would enhance the blog content.",
      "IMPORTANT: Avoid any queries that might return screenshots, app interfaces, branding, logos, or specific products.",
      "Focus on generic concepts that represent blog content, lifestyle, and professional topics:",
      "- Lifestyle concepts: 'productive workspace', 'organized desk', 'professional attire', 'focused work'",
      "- Business concepts: 'business meeting', 'office workspace', 'professional environment', 'team discussion'",
      "- Abstract concepts: 'growth charts', 'success metrics', 'innovation', 'problem solving'",
      "- People concepts: 'diverse professionals', 'team collaboration', 'individual working', 'group discussion'",
      "",
      "Good examples: 'business presentation', 'team collaboration', 'professional workspace', 'productive environment', 'successful meeting', 'growth mindset'",
      "Bad examples: 'application screenshot', 'app interface', 'software demo', 'product logo', 'brand identity'",
      "The queries should find PEOPLE, OBJECTS, SCENES, or CONCEPTS that enhance blog content - never screenshots or interfaces.",
      "CRITICAL: Return ONLY a JSON array of strings with generic, descriptive terms, no markdown formatting, no code blocks, no other text.",
      'Example: ["business presentation", "team collaboration", "professional workspace"]',
    ].join("\n");
  }
}
