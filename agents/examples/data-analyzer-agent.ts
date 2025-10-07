/**
 * Example: Data Analyzer Agent
 * 
 * Demonstrates how to build an agent within GAFF that uses GAFF's MCP servers.
 * This agent analyzes data using GAFF's tools: memory, sandbox, thinking, etc.
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

import { GaffAgentBase } from '../gaff-agent-base.js';

interface AnalysisInput {
  data: any;
  analysis_type: string;
  context: string;
}

interface AnalysisOutput {
  analysis: string;
  confidence: number;
  insights: string[];
  classifications: Record<string, any>;
}

/**
 * Data Analyzer Agent - Uses GAFF MCP servers internally
 */
export class DataAnalyzerAgent extends GaffAgentBase {
  constructor() {
    super('DataAnalyzer');
  }
  
  /**
   * Execute data analysis
   */
  async execute(input: AnalysisInput): Promise<AnalysisOutput> {
    console.error('\n🔍 Starting Data Analysis...\n');
    
    // Validate input
    this.validateInput(input);
    
    const { data, analysis_type, context } = input;
    
    // Step 1: Use sequential thinking to plan the analysis
    console.error('💭 Planning analysis approach...');
    await this.think(
      `I need to analyze ${analysis_type} data. Let me break this down into steps.`,
      1,
      3,
      true
    );
    
    // Step 2: Store context in memory for future reference
    console.error('💾 Storing analysis context in memory...');
    await this.memory_create([{
      name: `analysis_${Date.now()}`,
      entityType: 'analysis_job',
      observations: [
        `Type: ${analysis_type}`,
        `Context: ${context}`,
        `Timestamp: ${new Date().toISOString()}`
      ]
    }]);
    
    // Step 3: Execute analysis code in sandbox
    console.error('🔒 Running analysis code in sandbox...');
    const analysisCode = this.generateAnalysisCode(data, analysis_type);
    const sandboxResult = await this.sandbox_execute('python', analysisCode);
    
    console.error('Sandbox result:', sandboxResult);
    
    // Step 4: Parse results
    const analysis = this.parseAnalysisResults(sandboxResult);
    
    // Step 5: Store results in memory
    console.error('💾 Storing results in memory...');
    await this.memory_create([{
      name: `analysis_result_${Date.now()}`,
      entityType: 'analysis_result',
      observations: [
        `Analysis: ${analysis.analysis}`,
        `Confidence: ${analysis.confidence}`,
        `Insights count: ${analysis.insights.length}`
      ]
    }]);
    
    console.error('✅ Analysis complete!\n');
    
    return analysis;
  }
  
  /**
   * Generate analysis code based on type
   */
  private generateAnalysisCode(data: any, analysisType: string): string {
    const dataJson = JSON.stringify(data);
    
    switch (analysisType) {
      case 'pattern_recognition':
        return `
import json
import statistics

data = ${dataJson}

# Pattern analysis
if isinstance(data, list):
    print(f"Dataset size: {len(data)}")
    if all(isinstance(x, (int, float)) for x in data):
        mean = statistics.mean(data)
        median = statistics.median(data)
        print(f"Mean: {mean}")
        print(f"Median: {median}")
        print(f"Pattern: {'increasing' if data[-1] > data[0] else 'decreasing'}")
else:
    print(f"Data type: {type(data).__name__}")
    print(f"Keys: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
`;
      
      case 'data_classification':
        return `
import json

data = ${dataJson}

# Classification logic
classification = {
    'type': type(data).__name__,
    'complexity': 'simple' if len(str(data)) < 100 else 'complex',
    'structure': 'structured' if isinstance(data, dict) else 'unstructured'
}

print(json.dumps(classification))
`;
      
      default:
        return `
import json

data = ${dataJson}

# General analysis
result = {
    'type': type(data).__name__,
    'size': len(data) if hasattr(data, '__len__') else 1,
    'summary': str(data)[:100]
}

print(json.dumps(result))
`;
    }
  }
  
  /**
   * Parse sandbox results into structured output
   */
  private parseAnalysisResults(sandboxResult: any): AnalysisOutput {
    // Extract text from sandbox response
    const text = sandboxResult.content?.[0]?.text || '';
    
    // Parse the output
    const lines = text.split('\n').filter((l: string) => l.trim());
    
    return {
      analysis: text,
      confidence: 0.85,
      insights: lines.slice(0, 3),
      classifications: {
        completed: true,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const agent = new DataAnalyzerAgent();
    
    try {
      await agent.initialize();
      
      const result = await agent.execute({
        data: [1, 2, 3, 5, 8, 13, 21, 34],
        analysis_type: 'pattern_recognition',
        context: 'Fibonacci sequence analysis'
      });
      
      console.log('\n📊 Analysis Results:');
      console.log(JSON.stringify(result, null, 2));
      
      await agent.shutdown();
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}

