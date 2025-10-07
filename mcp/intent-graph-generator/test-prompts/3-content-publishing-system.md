# Test Prompt: Content Creation & Publishing Multi-Agent System

Use the intent-graph MCP server to generate an intent graph for this content publishing workflow:

---

**User Query:** "Create a comprehensive blog post about 'The Future of Quantum Computing in Drug Discovery' with SEO optimization, technical accuracy review, compliance checking, social media variants, and multi-channel distribution."

**System Configuration:**

```json
{
  "orchestration_card": {
    "user_request": {
      "description": "Create a comprehensive blog post about 'The Future of Quantum Computing in Drug Discovery' with SEO optimization, technical accuracy review, compliance checking, social media variants, and multi-channel distribution.",
      "domain": "content_creation_publishing"
    },
    "available_agents": [
      {
        "name": "ContentWriter",
        "type": "llm",
        "description": "Generates long-form content based on topic and target audience",
        "capabilities": ["article_writing", "technical_writing", "storytelling", "tone_adaptation"],
        "input_schema": { "topic": "string", "audience": "string", "word_count": "number", "style_guide": "object" },
        "output_schema": { "article": "string", "word_count": "number", "readability_score": "number" }
      },
      {
        "name": "SEOOptimizer",
        "type": "llm",
        "description": "Optimizes content for search engines with keywords, meta descriptions, and structure",
        "capabilities": ["keyword_research", "meta_tag_generation", "internal_linking", "heading_optimization"],
        "input_schema": { "article": "string", "target_keywords": "array", "competitors": "array" },
        "output_schema": { "optimized_article": "string", "meta_description": "string", "seo_score": "number", "keyword_density": "object" }
      },
      {
        "name": "FactChecker",
        "type": "api",
        "description": "Verifies factual accuracy and technical claims using authoritative sources",
        "capabilities": ["fact_verification", "source_checking", "citation_generation", "expert_validation"],
        "input_schema": { "article": "string", "claims": "array" },
        "output_schema": { "verified_claims": "array", "inaccuracies": "array", "citations": "array", "confidence": "number" }
      },
      {
        "name": "ComplianceReviewer",
        "type": "validator",
        "description": "Checks content for legal compliance, brand guidelines, and regulatory requirements",
        "capabilities": ["legal_review", "brand_compliance", "accessibility_checking", "disclaimer_validation"],
        "input_schema": { "article": "string", "industry": "string", "regulations": "array" },
        "output_schema": { "is_compliant": "boolean", "violations": "array", "required_disclaimers": "array" }
      },
      {
        "name": "ImageGenerator",
        "type": "api",
        "description": "Creates visual assets including featured images, infographics, and social media graphics",
        "capabilities": ["image_generation", "infographic_creation", "brand_styling", "format_optimization"],
        "input_schema": { "article_summary": "string", "style": "string", "dimensions": "object" },
        "output_schema": { "images": "array", "alt_texts": "array", "image_urls": "array" }
      },
      {
        "name": "SocialMediaAdapter",
        "type": "llm",
        "description": "Creates platform-specific social media variants from main content",
        "capabilities": ["content_summarization", "platform_adaptation", "hashtag_generation", "engagement_optimization"],
        "input_schema": { "article": "string", "platforms": "array" },
        "output_schema": { "posts": "object", "hashtags": "object", "optimal_timing": "object" }
      },
      {
        "name": "PublishingOrchestrator",
        "type": "api",
        "description": "Distributes content across multiple channels (blog, social, email, newsletter)",
        "capabilities": ["cms_publishing", "social_scheduling", "email_distribution", "analytics_tracking"],
        "input_schema": { "content_package": "object", "schedule": "object", "channels": "array" },
        "output_schema": { "published_urls": "array", "scheduled_posts": "array", "tracking_ids": "object" }
      }
    ],
    "system_configuration": {
      "system_name": "Content Creation & Publishing Pipeline",
      "system_description": "End-to-end content creation system that generates, optimizes, validates, and distributes high-quality content across multiple channels with full compliance and SEO optimization.",
      "system_purpose": "Enable marketers and content creators to produce professional, accurate, compliant, and SEO-optimized content at scale with automated multi-channel distribution.",
      "output_format": "markdown",
      "custom_prompt_template": "# Content Pipeline Orchestrator\n\nYou are a content pipeline orchestrator that creates publishing workflows for content creation AI agents.\n\n## Pipeline Stages\n\nFor each content request, create a workflow that:\n1. **Generates** high-quality long-form content\n2. **Optimizes** for search engines and discoverability\n3. **Validates** factual accuracy and technical claims\n4. **Reviews** for legal/brand compliance\n5. **Creates** visual assets and graphics\n6. **Adapts** for social media platforms\n7. **Publishes** across multiple channels\n\n## Output Format\n\n### Content Brief\n[Overview of content topic, target audience, and goals]\n\n### Pipeline Nodes\n\n| Stage | Activity | Agent | Input | Output | Quality Gate | Dependencies |\n|-------|----------|-------|-------|--------|--------------|-------------|\n| C1 | [Task] | [Agent] | [Source] | [Deliverable] | [Criteria] | [Prerequisites] |\n\n### Production Flow\n```mermaid\ngraph TD\n    C1[Write Content] -->|draft| C2[SEO Optimize]\n    C2 -->|optimized| C3[Fact Check]\n    C3 -->|verified| C4[Compliance Review]\n    C4 -->|approved| C5[Generate Images]\n    C5 -->|package| C6[Social Variants]\n    C6 -->|ready| C7[Publish Multi-Channel]\n```\n\n### Quality Gates\n- [Stage → Stage]: [Quality criteria that must pass]\n\n### Distribution Channels\n- [Channel 1]: [Content format and timing]\n- [Channel 2]: [Content format and timing]\n\n### Success Metrics\n- [KPI 1]\n- [KPI 2]",
      "agent_descriptions": [
        {
          "agent_name": "ContentWriter",
          "description": "AI writer trained on industry-specific content to generate engaging, informative long-form articles",
          "capabilities": ["Long-form article writing (1000-3000 words)", "Technical content simplification", "Narrative storytelling", "Audience tone adaptation"],
          "example_usage": "Topic: 'Quantum Computing in Drug Discovery' → Generates 2000-word article with introduction, key benefits, challenges, case studies, and future outlook"
        },
        {
          "agent_name": "SEOOptimizer",
          "description": "SEO specialist that optimizes content structure, keywords, and metadata for search visibility",
          "capabilities": ["Keyword density optimization", "Meta description crafting", "Header structure (H1-H6)", "Internal linking strategy"],
          "example_usage": "Article → Adds keywords: 'quantum computing drug discovery' (1.2% density), meta: 'Discover how quantum computing revolutionizes pharmaceutical research...', optimized H2s"
        },
        {
          "agent_name": "FactChecker",
          "description": "Validates claims against scientific databases, academic sources, and expert knowledge bases",
          "capabilities": ["PubMed/arXiv citation checking", "Statistical claim verification", "Expert source validation", "Citation formatting"],
          "example_usage": "Claim: 'Quantum computers can simulate molecular interactions 1000x faster' → Verified against Nature paper (2024), added citation"
        },
        {
          "agent_name": "ComplianceReviewer",
          "description": "Ensures content meets legal, regulatory, and brand guidelines before publication",
          "capabilities": ["FDA/medical claim compliance", "Brand voice guidelines", "Accessibility (WCAG)", "Disclaimer requirements"],
          "example_usage": "Medical content → Adds disclaimer: 'This content is for informational purposes only...', confirms no unapproved health claims"
        },
        {
          "agent_name": "ImageGenerator",
          "description": "Creates branded visual assets using AI image generation and design tools",
          "capabilities": ["Featured image generation", "Infographic creation", "Chart/diagram design", "Social media graphics"],
          "example_usage": "Article topic → Generates: featured image (1200x630px), 3 infographics, 5 social variants, all with brand colors"
        },
        {
          "agent_name": "SocialMediaAdapter",
          "description": "Transforms long-form content into platform-optimized social media posts",
          "capabilities": ["Thread creation (Twitter/X)", "LinkedIn article format", "Instagram carousel design", "TikTok script writing"],
          "example_usage": "2000-word article → Twitter thread (8 tweets), LinkedIn post (300 words), Instagram carousel (10 slides), optimal hashtags"
        },
        {
          "agent_name": "PublishingOrchestrator",
          "description": "Distributes content across CMS, social platforms, email systems with scheduling and tracking",
          "capabilities": ["WordPress/CMS publishing", "Social media scheduling", "Email blast sending", "UTM tracking setup"],
          "example_usage": "Content package → Published: WordPress (immediate), scheduled: Twitter (3pm), LinkedIn (10am next day), email (Thu 9am)"
        }
      ],
      "example_outputs": [
        {
          "description": "Example: Technical Blog Post Production Pipeline",
          "output": "### Content Brief\nCreate comprehensive technical blog post on quantum computing applications in pharmaceutical R&D. Target audience: biotech professionals, pharma researchers, tech investors. Goals: establish thought leadership, drive organic traffic, generate qualified leads.\n\n### Pipeline Nodes\n\n| Stage | Activity | Agent | Input | Output | Quality Gate | Dependencies |\n|-------|----------|-------|-------|--------|--------------|-------------|\n| C1 | Draft 2000-word article | ContentWriter | topic, audience, style | draft_article | Readability > 60 | [] |\n| C2 | SEO optimization | SEOOptimizer | draft_article, keywords | seo_article | SEO score > 80 | [C1] |\n| C3 | Fact verification | FactChecker | seo_article, claims | verified_article | Accuracy > 95% | [C2] |\n| C4 | Compliance review | ComplianceReviewer | verified_article | approved_article | Zero violations | [C3] |\n| C5 | Generate visuals | ImageGenerator | article_summary | images | Brand compliant | [C4] |\n| C6 | Create social variants | SocialMediaAdapter | approved_article | social_posts | Engagement score > 70 | [C4] |\n| C7 | Multi-channel publish | PublishingOrchestrator | content_package | publish_status | All channels live | [C5, C6] |\n\n### Production Flow\n```mermaid\ngraph TD\n    C1[Write 2000-word article] -->|draft| C2[SEO Optimize]\n    C2 -->|keywords + meta| C3[Fact Check]\n    C3 -->|verified + citations| C4[Compliance Review]\n    C4 -->|approved| C5[Generate Images]\n    C4 -->|approved| C6[Social Variants]\n    C5 -->|visuals| C7[Publish]\n    C6 -->|posts| C7\n    C7 -->|live| C8[Analytics Tracking]\n```\n\n### Quality Gates\n- C1 → C2: Readability score > 60, word count 1800-2200, proper structure\n- C2 → C3: SEO score > 80, keyword density 1-2%, meta description < 160 chars\n- C3 → C4: All claims verified, 5+ authoritative citations, 95%+ accuracy\n- C4 → C5/C6: Zero compliance violations, disclaimers added, brand voice approved\n- C5/C6 → C7: All assets brand-compliant, formats correct, tracking codes added\n\n### Distribution Channels\n- **Blog**: WordPress publish (immediate), featured image, internal links, schema markup\n- **LinkedIn**: Article format (300 words), 3 hashtags, schedule 10am Tuesday\n- **Twitter/X**: 8-tweet thread, schedule 3pm Monday\n- **Email**: Newsletter feature, send Thursday 9am to 50K subscribers\n- **Instagram**: Carousel post (10 slides), schedule 1pm Wednesday\n\n### Success Metrics\n- Organic traffic: 5,000+ visits in first month\n- Average time on page: > 4 minutes\n- Social engagement: 500+ combined interactions\n- Email CTR: > 3.5%\n- Lead generation: 50+ qualified leads"
        }
      ],
      "output_schema": {
        "type": "object",
        "properties": {
          "pipeline_nodes": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "stage_id": { "type": "string" },
                "activity": { "type": "string" },
                "agent": { "type": "string" },
                "input": { "type": "string" },
                "output": { "type": "string" },
                "quality_gate": { "type": "string" },
                "dependencies": { "type": "array" }
              },
              "required": ["stage_id", "agent", "activity"]
            }
          },
          "quality_gates": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "stage_transition": { "type": "string" },
                "criteria": { "type": "string" }
              }
            }
          },
          "distribution_channels": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "channel": { "type": "string" },
                "format": { "type": "string" },
                "timing": { "type": "string" }
              }
            }
          },
          "success_metrics": { "type": "array" }
        }
      },
      "execution_model": "dag",
      "validation_rules": [
        "Content must pass fact-checking before compliance review",
        "Compliance approval required before any publishing",
        "All visual assets must be brand-compliant",
        "Social media posts must include optimal hashtags",
        "All published content must have tracking codes"
      ]
    }
  },
  "options": {
    "generation_mode": "delegate_to_caller"
  }
}
```

---

**Instructions for Claude:**

1. Use the `generate_intent_graph` tool with the content publishing configuration
2. Generate a complete content creation and distribution workflow
3. Include all stages: writing, SEO, fact-checking, compliance, visuals, social adaptation, and multi-channel publishing
4. Format with the pipeline table, Mermaid flow diagram, quality gates, and success metrics

---

**Expected Output:** A comprehensive content pipeline workflow that takes a topic from initial draft through fact-checking, optimization, and multi-channel distribution with quality gates at each stage.

