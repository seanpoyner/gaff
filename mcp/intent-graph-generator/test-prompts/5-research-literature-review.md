# Test Prompt: Scientific Research Literature Review Multi-Agent System

Use the intent-graph MCP server to generate an intent graph for this research workflow:

---

**User Query:** "Conduct comprehensive literature review on 'CRISPR gene editing for treating sickle cell disease' - search PubMed, arXiv, clinical trials, analyze methodologies, synthesize findings, identify research gaps, and generate annotated bibliography with citation network analysis."

**System Configuration:**

```json
{
  "orchestration_card": {
    "user_request": {
      "description": "Conduct comprehensive literature review on 'CRISPR gene editing for treating sickle cell disease' - search PubMed, arXiv, clinical trials, analyze methodologies, synthesize findings, identify research gaps, and generate annotated bibliography with citation network analysis.",
      "domain": "scientific_research"
    },
    "available_agents": [
      {
        "name": "LiteratureSearcher",
        "type": "api",
        "description": "Searches academic databases (PubMed, arXiv, Web of Science, clinical trial registries)",
        "capabilities": ["multi_database_search", "boolean_query_construction", "relevance_filtering", "citation_retrieval"],
        "input_schema": { "query": "string", "databases": "array", "date_range": "object", "filters": "object" },
        "output_schema": { "papers": "array", "total_results": "number", "search_metadata": "object" }
      },
      {
        "name": "RelevanceRanker",
        "type": "llm",
        "description": "Ranks and filters papers by relevance to research question",
        "capabilities": ["semantic_relevance", "quality_assessment", "impact_scoring", "duplicate_detection"],
        "input_schema": { "papers": "array", "research_question": "string", "inclusion_criteria": "object" },
        "output_schema": { "ranked_papers": "array", "relevance_scores": "object", "excluded_papers": "array" }
      },
      {
        "name": "MethodologyAnalyzer",
        "type": "llm",
        "description": "Extracts and analyzes research methodologies, experimental designs, and protocols",
        "capabilities": ["methodology_extraction", "study_design_classification", "protocol_analysis", "reproducibility_assessment"],
        "input_schema": { "papers": "array" },
        "output_schema": { "methodologies": "array", "study_types": "object", "common_protocols": "array" }
      },
      {
        "name": "FindingsSynthesizer",
        "type": "llm",
        "description": "Synthesizes findings across studies, identifies patterns and contradictions",
        "capabilities": ["meta_analysis", "theme_extraction", "contradiction_detection", "evidence_synthesis"],
        "input_schema": { "papers": "array", "methodologies": "array" },
        "output_schema": { "key_findings": "array", "themes": "array", "contradictions": "array", "evidence_strength": "object" }
      },
      {
        "name": "GapAnalyzer",
        "type": "llm",
        "description": "Identifies research gaps, unanswered questions, and future research directions",
        "capabilities": ["gap_identification", "trend_analysis", "frontier_detection", "recommendation_generation"],
        "input_schema": { "findings_synthesis": "object", "current_research": "array" },
        "output_schema": { "research_gaps": "array", "future_directions": "array", "understudied_areas": "array" }
      },
      {
        "name": "CitationNetworkBuilder",
        "type": "api",
        "description": "Builds citation network graphs and analyzes paper relationships",
        "capabilities": ["citation_graph_building", "influence_analysis", "cluster_detection", "seminal_paper_identification"],
        "input_schema": { "papers": "array" },
        "output_schema": { "citation_network": "object", "influential_papers": "array", "research_clusters": "array" }
      },
      {
        "name": "BibliographyGenerator",
        "type": "tool",
        "description": "Generates formatted annotated bibliography with summaries and citations",
        "capabilities": ["citation_formatting", "annotation_generation", "bibliography_organization", "export_formats"],
        "input_schema": { "papers": "array", "annotations": "object", "citation_style": "string" },
        "output_schema": { "bibliography": "string", "bibtex": "string", "ris": "string", "word_count": "number" }
      }
    ],
    "system_configuration": {
      "system_name": "Scientific Research Literature Review System",
      "system_description": "AI-powered systematic literature review system that searches academic databases, analyzes methodologies, synthesizes findings, identifies research gaps, and generates comprehensive annotated bibliographies with citation network analysis.",
      "system_purpose": "Accelerate scientific research by automating comprehensive literature reviews, enabling researchers to quickly understand the state of the art, identify gaps, and discover connections between studies.",
      "output_format": "markdown",
      "custom_prompt_template": "# Research Literature Review Orchestrator\n\nYou are a research review orchestrator that creates systematic review workflows for academic AI agents.\n\n## Review Protocol\n\nFor each research question, create a workflow that:\n1. **Searches** relevant academic databases comprehensively\n2. **Ranks** papers by relevance and quality\n3. **Analyzes** methodologies and study designs\n4. **Synthesizes** findings across studies\n5. **Identifies** research gaps and future directions\n6. **Builds** citation networks and influence maps\n7. **Generates** annotated bibliography\n\n## Output Format\n\n### Research Question\n[Clear statement of the research topic and objectives]\n\n### Review Scope\n- Databases: [List]\n- Date range: [Years]\n- Inclusion criteria: [Criteria]\n\n### Review Nodes\n\n| Phase | Activity | Agent | Data Source | Output | Quality Check | Dependencies |\n|-------|----------|-------|-------------|--------|---------------|-------------|\n| R1 | [Task] | [Agent] | [Source] | [Result] | [Criteria] | [Prerequisites] |\n\n### Review Flow\n```mermaid\ngraph TD\n    R1[Search Databases] -->|papers| R2[Rank by Relevance]\n    R2 -->|top_papers| R3[Analyze Methods]\n    R3 -->|methodologies| R4[Synthesize Findings]\n    R4 -->|synthesis| R5[Identify Gaps]\n    R2 -->|citations| R6[Build Network]\n    R5 -->|complete| R7[Generate Bibliography]\n```\n\n### Expected Deliverables\n- [Deliverable 1]\n- [Deliverable 2]\n\n### Research Impact\n- [Impact metric 1]\n- [Impact metric 2]",
      "agent_descriptions": [
        {
          "agent_name": "LiteratureSearcher",
          "description": "Comprehensive academic database search agent with advanced query construction",
          "capabilities": ["PubMed/MEDLINE search", "arXiv preprint search", "ClinicalTrials.gov", "Web of Science", "Boolean query optimization"],
          "example_usage": "Query: 'CRISPR AND sickle cell disease' → PubMed: 487 papers, arXiv: 23 papers, ClinicalTrials: 12 trials, total: 522 results"
        },
        {
          "agent_name": "RelevanceRanker",
          "description": "AI ranker that assesses paper relevance using semantic similarity and quality metrics",
          "capabilities": ["Semantic relevance scoring", "Journal impact factor weighting", "Citation count consideration", "Recency prioritization"],
          "example_usage": "522 papers → Ranked by relevance → Top 50 papers (relevance > 0.85), excluded 89 duplicates, 383 low-relevance"
        },
        {
          "agent_name": "MethodologyAnalyzer",
          "description": "Extracts and categorizes research methodologies from papers",
          "capabilities": ["RCT identification", "In vitro/in vivo classification", "Sample size extraction", "Protocol standardization"],
          "example_usage": "50 papers → Methodologies: 15 RCTs, 20 in vitro, 8 case studies, 7 reviews → Common protocol: BCL11A targeting"
        },
        {
          "agent_name": "FindingsSynthesizer",
          "description": "Synthesizes findings across studies using meta-analysis techniques",
          "capabilities": ["Effect size calculation", "Statistical pooling", "Theme extraction", "Contradiction identification"],
          "example_usage": "Key finding: 90% efficacy across 15 RCTs, main themes: safety, durability, theme: off-target effects (8 studies)"
        },
        {
          "agent_name": "GapAnalyzer",
          "description": "Identifies understudied areas and proposes future research directions",
          "capabilities": ["Gap detection through coverage analysis", "Trend identification", "Frontier research spotting"],
          "example_usage": "Gaps identified: long-term safety (>10 years), pediatric populations, cost-effectiveness, delivery optimization"
        },
        {
          "agent_name": "CitationNetworkBuilder",
          "description": "Builds citation graphs using DOI links and analyzes paper influence",
          "capabilities": ["Citation graph construction", "PageRank for papers", "Research cluster detection"],
          "example_usage": "Network: 522 nodes, 1,847 edges → Seminal papers: Frangoul et al. (2021) - 247 citations, 3 major clusters identified"
        },
        {
          "agent_name": "BibliographyGenerator",
          "description": "Generates formatted bibliographies with annotations in multiple citation styles",
          "capabilities": ["APA/MLA/Chicago formatting", "Annotation generation", "BibTeX/RIS export"],
          "example_usage": "Generates: 50-entry annotated bibliography, APA 7th edition, 150-word annotations, exports: .bib, .ris, .docx"
        }
      ],
      "example_outputs": [
        {
          "description": "Example: CRISPR Sickle Cell Literature Review",
          "output": "### Research Question\nWhat is the current state of CRISPR-Cas9 gene editing for treating sickle cell disease, including clinical efficacy, safety profile, and outstanding research challenges?\n\n### Review Scope\n- **Databases**: PubMed/MEDLINE, arXiv, ClinicalTrials.gov, Cochrane Library\n- **Date range**: 2015-2024 (CRISPR clinical era)\n- **Inclusion criteria**: Human studies or clinical-grade protocols, peer-reviewed, English language\n- **Exclusion criteria**: Animal-only studies, opinion pieces, non-CRISPR approaches\n\n### Review Nodes\n\n| Phase | Activity | Agent | Data Source | Output | Quality Check | Dependencies |\n|-------|----------|-------|-------------|--------|---------------|-------------|\n| R1 | Search academic databases | LiteratureSearcher | PubMed, arXiv, CT.gov | 522 papers | Deduplication | [] |\n| R2 | Rank by relevance | RelevanceRanker | Search results | Top 50 papers | Relevance > 0.85 | [R1] |\n| R3 | Extract methodologies | MethodologyAnalyzer | Top papers | Study designs | Protocol validation | [R2] |\n| R4 | Synthesize findings | FindingsSynthesizer | Papers + methods | Key findings | Evidence strength | [R3] |\n| R5 | Identify research gaps | GapAnalyzer | Synthesis | Gap analysis | Comprehensive coverage | [R4] |\n| R6 | Build citation network | CitationNetworkBuilder | All papers | Network graph | Citation accuracy | [R2] |\n| R7 | Generate bibliography | BibliographyGenerator | Annotated papers | Bibliography | Format compliance | [R5, R6] |\n\n### Review Flow\n```mermaid\ngraph TD\n    R1[Search: PubMed, arXiv, CT.gov] -->|522 papers| R2[Rank by Relevance]\n    R2 -->|Top 50| R3[Analyze Methodologies]\n    R3 -->|Study types| R4[Synthesize Findings]\n    R4 -->|Key findings| R5[Identify Gaps]\n    R2 -->|Citation data| R6[Build Citation Network]\n    R5 -->|Complete analysis| R7[Generate Bibliography]\n    R6 -->|Network insights| R7\n```\n\n### Expected Deliverables\n- **Systematic Review Report**: 25-30 pages covering methodology, findings, gaps\n- **Annotated Bibliography**: 50 entries with 150-word annotations per paper\n- **Citation Network Visualization**: Interactive graph showing paper relationships and influence\n- **Research Gap Analysis**: 5-10 identified gaps with justification and proposed studies\n- **Methodology Summary Table**: Categorization of all study designs and protocols\n- **Data Extraction Forms**: Standardized data from each paper (efficacy, safety, n=)\n\n### Research Impact\n- Accelerate understanding of CRISPR therapy state-of-art (3 months → 1 week)\n- Identify high-impact papers (top 10% by citations and relevance)\n- Reveal understudied areas for future research proposals\n- Provide evidence synthesis for clinical guidelines\n- Generate citation network showing research evolution and key contributors"
        }
      ],
      "output_schema": {
        "type": "object",
        "properties": {
          "review_nodes": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "phase_id": { "type": "string" },
                "activity": { "type": "string" },
                "agent": { "type": "string" },
                "data_source": { "type": "string" },
                "output": { "type": "string" },
                "quality_check": { "type": "string" },
                "dependencies": { "type": "array" }
              },
              "required": ["phase_id", "agent", "activity"]
            }
          },
          "research_question": { "type": "string" },
          "review_scope": {
            "type": "object",
            "properties": {
              "databases": { "type": "array" },
              "date_range": { "type": "string" },
              "inclusion_criteria": { "type": "array" }
            }
          },
          "deliverables": { "type": "array" },
          "research_impact": { "type": "array" }
        }
      },
      "execution_model": "dag",
      "validation_rules": [
        "Literature search must cover at least 3 major academic databases",
        "Relevance ranking must exclude duplicates and low-quality sources",
        "Methodology analysis required before findings synthesis",
        "Citation network must include all selected papers",
        "Bibliography must follow specified citation style (APA/MLA/Chicago)",
        "All findings must be supported by at least 3 independent studies"
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

1. Use the `generate_intent_graph` tool with the research literature review configuration
2. Generate a systematic literature review workflow
3. Include database searching, relevance ranking, methodology analysis, findings synthesis, gap analysis, citation network building, and bibliography generation
4. Format with the review table, Mermaid flow diagram, scope definition, and expected deliverables

---

**Expected Output:** A comprehensive systematic literature review workflow that searches academic databases, analyzes methodologies, synthesizes findings, identifies research gaps, builds citation networks, and generates an annotated bibliography with proper academic rigor.

