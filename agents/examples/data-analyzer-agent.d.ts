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
export declare class DataAnalyzerAgent extends GaffAgentBase {
    constructor();
    /**
     * Execute data analysis
     */
    execute(input: AnalysisInput): Promise<AnalysisOutput>;
    /**
     * Generate analysis code based on type
     */
    private generateAnalysisCode;
    /**
     * Parse sandbox results into structured output
     */
    private parseAnalysisResults;
}
export {};
//# sourceMappingURL=data-analyzer-agent.d.ts.map