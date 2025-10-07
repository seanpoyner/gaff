/**
 * HTTP Server for IntentGraph MCP Server
 * Implements MCP Streamable transport for Copilot Studio integration
 */

import express, { Request, Response, NextFunction } from 'express';
import { generateIntentGraphTool } from './tools/generate.js';
import { 
  validateGraphTool, 
  analyzeGraphTool, 
  optimizeGraphTool, 
  exportGraphTool, 
  visualizeGraphTool, 
  generateArtifactsTool 
} from './tools/helpers.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: 'text/event-stream' }));

// CORS for Copilot Studio
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Tool definitions
const TOOL_DEFINITIONS = [
  {
    name: 'generate_intent_graph',
    description: 'Generate a complete intent graph from an orchestration card using AI. Input: orchestration_card (object with user_request, available_agents, constraints, preferences), options (validate, optimize, include_artifacts). Output: intent_graph with nodes, edges, execution_plan, metadata, and optional artifacts.',
    inputSchema: {
      type: 'object',
      properties: {
        orchestration_card: { 
          type: 'object',
          description: 'Context for generation with user_request, available_agents, constraints, preferences',
          required: true
        },
        options: {
          type: 'object',
          properties: {
            include_artifacts: { type: 'boolean', description: 'Include reasoning and alternatives' },
            artifact_types: { type: 'array', items: { type: 'string' } },
            format: { type: 'string', enum: ['json', 'yaml'] },
            validate: { type: 'boolean', description: 'Validate the generated graph' },
            optimize: { type: 'boolean', description: 'Optimize the generated graph' }
          }
        }
      },
      required: ['orchestration_card']
    }
  },
  {
    name: 'validate_graph',
    description: 'Validate an intent graph structure and return detailed validation report',
    inputSchema: {
      type: 'object',
      properties: {
        graph: { type: 'object', description: 'The intent graph to validate', required: true }
      },
      required: ['graph']
    }
  },
  {
    name: 'analyze_graph',
    description: 'Analyze graph complexity, metrics, and identify optimization opportunities',
    inputSchema: {
      type: 'object',
      properties: {
        graph: { type: 'object', description: 'The intent graph to analyze', required: true },
        analysis_types: {
          type: 'array',
          items: { type: 'string', enum: ['complexity', 'parallel_opportunities', 'critical_path', 'bottlenecks'] }
        }
      },
      required: ['graph']
    }
  },
  {
    name: 'optimize_graph',
    description: 'Optimize an intent graph by applying improvements and restructuring',
    inputSchema: {
      type: 'object',
      properties: {
        graph: { type: 'object', description: 'The intent graph to optimize', required: true },
        optimization_strategies: {
          type: 'array',
          items: { type: 'string', enum: ['parallelize', 'reduce_latency', 'minimize_cost', 'improve_reliability'] }
        }
      },
      required: ['graph']
    }
  },
  {
    name: 'export_graph',
    description: 'Export an intent graph in various formats (json, yaml, dot, mermaid)',
    inputSchema: {
      type: 'object',
      properties: {
        graph: { type: 'object', description: 'The intent graph to export', required: true },
        format: { type: 'string', enum: ['json', 'yaml', 'dot', 'mermaid'], default: 'json' }
      },
      required: ['graph']
    }
  },
  {
    name: 'visualize_graph',
    description: 'Generate Mermaid diagram for intent graph visualization',
    inputSchema: {
      type: 'object',
      properties: {
        graph: { type: 'object', description: 'The intent graph to visualize', required: true },
        options: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['TB', 'LR'], default: 'TB' },
            include_metadata: { type: 'boolean', default: false }
          }
        }
      },
      required: ['graph']
    }
  },
  {
    name: 'generate_artifacts',
    description: 'Generate debugging and logging artifacts for a graph generation session',
    inputSchema: {
      type: 'object',
      properties: {
        graph: { type: 'object', description: 'The generated intent graph', required: true },
        orchestration_card: { type: 'object', description: 'The orchestration card used', required: true },
        artifact_types: {
          type: 'array',
          items: { type: 'string', enum: ['reasoning', 'alternatives', 'optimizations', 'execution_trace', 'debug_info'] }
        }
      },
      required: ['graph', 'orchestration_card']
    }
  }
];

// MCP Protocol handler
async function handleMCPRequest(mcpRequest: any): Promise<any> {
  try {
    const { method, params } = mcpRequest;

    // Handle list_tools
    if (method === 'tools/list') {
      return {
        tools: TOOL_DEFINITIONS
      };
    }

    // Handle call_tool
    if (method === 'tools/call') {
      const { name, arguments: args } = params;

      let response;
      switch (name) {
        case 'generate_intent_graph':
          response = await generateIntentGraphTool({
            orchestration_card: args.orchestration_card,
            options: args.options
          });
          break;
        case 'validate_graph':
          response = await validateGraphTool({ graph: args.graph });
          break;
        case 'analyze_graph':
          response = await analyzeGraphTool({
            graph: args.graph,
            analysis_types: args.analysis_types
          });
          break;
        case 'optimize_graph':
          response = await optimizeGraphTool({
            graph: args.graph,
            optimization_strategies: args.optimization_strategies
          });
          break;
        case 'export_graph':
          response = await exportGraphTool({
            graph: args.graph,
            format: args.format
          });
          break;
        case 'visualize_graph':
          response = await visualizeGraphTool({
            graph: args.graph,
            options: args.options
          });
          break;
        case 'generate_artifacts':
          response = await generateArtifactsTool({
            graph: args.graph,
            orchestration_card: args.orchestration_card,
            artifact_types: args.artifact_types
          });
          break;
        default:
          return {
            error: {
              code: -32601,
              message: `Unknown tool: ${name}`
            }
          };
      }

      // Format response for MCP
      if (response.success) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.result, null, 2)
            }
          ]
        };
      } else {
        return {
          error: {
            code: -32000,
            message: response.error.message,
            data: response.error
          }
        };
      }
    }

    return {
      error: {
        code: -32601,
        message: `Unknown method: ${method}`
      }
    };
  } catch (error) {
    console.error('[HTTP Server] Error handling MCP request:', error);
    return {
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      }
    };
  }
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: '2.1.0',
    server: 'IntentGraph MCP Server',
    transport: 'streamable',
    tools: TOOL_DEFINITIONS.length
  });
});

// MCP endpoint (Streamable transport)
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    console.error('[HTTP Server] Received MCP request');
    
    const mcpRequest = req.body;
    const mcpResponse = await handleMCPRequest(mcpRequest);

    // Send JSON-RPC response
    res.json({
      jsonrpc: '2.0',
      id: mcpRequest.id || null,
      result: mcpResponse.error ? undefined : mcpResponse,
      error: mcpResponse.error
    });
  } catch (error) {
    console.error('[HTTP Server] Error in /mcp endpoint:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal server error'
      }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`IntentGraph MCP HTTP Server v2.0.0 running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Transport: Streamable (HTTP)`);
  console.log(`Available tools: ${TOOL_DEFINITIONS.length}`);
});

export default app;

