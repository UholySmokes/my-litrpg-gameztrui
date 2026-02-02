#!/usr/bin/env node

/**
 * Middleware Dependency Graph Generator
 * 
 * Creates a visual dependency graph in Mermaid format showing:
 * - Endpoint relationships
 * - Shared middleware usage
 * - External service dependencies
 * 
 * Usage:
 *   node scripts/generate-dependency-graph.cjs [options]
 * 
 * Options:
 *   --output=<file>  Write to file instead of stdout (default: stdout)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_DIR = path.join(process.cwd(), 'api');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  output: null
};

args.forEach(arg => {
  if (arg.startsWith('--output=')) {
    options.output = arg.split('=')[1];
  }
});

/**
 * Analyzes dependencies similar to the main analyzer
 */
function analyzeDependencies(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const dependencies = {
      internal: [],
      external: [],
      functions: []
    };

    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    let match;
    
    while ((match = requireRegex.exec(content)) !== null) {
      const dep = match[1];
      if (dep.startsWith('.') || dep.startsWith('/')) {
        dependencies.internal.push(dep);
      } else {
        dependencies.external.push(dep);
      }
    }

    const destructureRegex = /const\s+{([^}]+)}\s+=\s+require\(['"]\.\.\/lib\/azure-ai-utils['"]\)/;
    const destructureMatch = content.match(destructureRegex);
    if (destructureMatch) {
      const functions = destructureMatch[1]
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);
      dependencies.functions = functions;
    }

    return dependencies;
  } catch (error) {
    return null;
  }
}

/**
 * Analyzes function.json configuration
 */
function analyzeFunctionConfig(functionDir) {
  const configPath = path.join(functionDir, 'function.json');
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(content);
    
    const httpTrigger = config.bindings?.find(b => b.type === 'httpTrigger');
    return {
      authLevel: httpTrigger?.authLevel || 'unknown',
      methods: httpTrigger?.methods || [],
      route: httpTrigger?.route || path.basename(functionDir),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Analyzes all endpoints
 */
function analyzeEndpoints() {
  const endpoints = [];
  
  const entries = fs.readdirSync(API_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'lib' || entry.name.startsWith('.')) continue;
    
    const functionDir = path.join(API_DIR, entry.name);
    const indexPath = path.join(functionDir, 'index.js');
    
    if (!fs.existsSync(indexPath)) continue;
    
    const deps = analyzeDependencies(indexPath);
    const config = analyzeFunctionConfig(functionDir);
    
    endpoints.push({
      name: entry.name,
      config,
      dependencies: deps
    });
  }
  
  return endpoints;
}

/**
 * Generates Mermaid graph
 */
function generateMermaidGraph() {
  const endpoints = analyzeEndpoints();
  
  let mermaid = '```mermaid\ngraph TB\n';
  
  // Define styles
  mermaid += '    classDef endpoint fill:#4A90E2,stroke:#2E5C8A,color:#fff\n';
  mermaid += '    classDef middleware fill:#50C878,stroke:#2E7D4E,color:#fff\n';
  mermaid += '    classDef external fill:#F5A623,stroke:#B87A1A,color:#fff\n';
  mermaid += '    classDef azure fill:#0078D4,stroke:#004C87,color:#fff\n\n';
  
  // Shared middleware node
  mermaid += '    UTILS[azure-ai-utils.js]:::middleware\n';
  
  // External services
  const externalServices = new Set();
  endpoints.forEach(endpoint => {
    endpoint.dependencies?.external?.forEach(dep => {
      externalServices.add(dep);
    });
  });
  
  // Add external service nodes
  externalServices.forEach(service => {
    const nodeId = service.replace(/[@\/\-]/g, '_');
    const label = service;
    if (service.includes('azure')) {
      mermaid += `    ${nodeId}[${label}]:::azure\n`;
    } else {
      mermaid += `    ${nodeId}[${label}]:::external\n`;
    }
  });
  
  mermaid += '\n';
  
  // Add endpoint nodes and connections
  endpoints.forEach(endpoint => {
    const nodeId = endpoint.name.replace(/[\-]/g, '_').toUpperCase();
    const methods = endpoint.config?.methods?.join('|') || '';
    const route = endpoint.config?.route || endpoint.name;
    const label = `${endpoint.name}\\n${methods} /api/${route}`;
    
    mermaid += `    ${nodeId}[${label}]:::endpoint\n`;
    
    // Connect to middleware if it uses it
    if (endpoint.dependencies?.functions?.length > 0) {
      const count = endpoint.dependencies.functions.length;
      mermaid += `    ${nodeId} -->|uses ${count} functions| UTILS\n`;
    }
    
    // Connect to external services
    endpoint.dependencies?.external?.forEach(dep => {
      const depId = dep.replace(/[@\/\-]/g, '_');
      mermaid += `    ${nodeId} --> ${depId}\n`;
    });
  });
  
  // Connect middleware to its dependencies
  mermaid += '\n    UTILS --> crypto\n';
  mermaid += '    UTILS --> redis\n';
  mermaid += '    UTILS --> undici\n';
  
  mermaid += '```\n';
  
  return mermaid;
}

/**
 * Generates a detailed dependency matrix
 */
function generateDependencyMatrix() {
  const endpoints = analyzeEndpoints();
  
  let output = '\n## Dependency Matrix\n\n';
  output += '| Endpoint | Middleware | Azure Identity | Durable Functions | Redis | Other |\n';
  output += '|----------|:----------:|:--------------:|:-----------------:|:-----:|:-----:|\n';
  
  endpoints.forEach(endpoint => {
    const name = endpoint.name;
    const usesMiddleware = endpoint.dependencies?.functions?.length > 0 ? '✓' : '-';
    const usesAzureIdentity = endpoint.dependencies?.external?.includes('@azure/identity') ? '✓' : '-';
    const usesDurable = endpoint.dependencies?.external?.includes('durable-functions') ? '✓' : '-';
    const usesRedis = endpoint.dependencies?.external?.includes('redis') ? '✓' : '-';
    
    const otherDeps = endpoint.dependencies?.external?.filter(dep => 
      !['@azure/identity', 'durable-functions', 'redis'].includes(dep)
    ) || [];
    const other = otherDeps.length > 0 ? otherDeps.length.toString() : '-';
    
    output += `| ${name} | ${usesMiddleware} | ${usesAzureIdentity} | ${usesDurable} | ${usesRedis} | ${other} |\n`;
  });
  
  return output;
}

/**
 * Main execution
 */
function main() {
  console.error('Generating dependency graph...\n');
  
  let output = '# Middleware Dependency Graph\n\n';
  output += `**Generated:** ${new Date().toISOString()}\n\n`;
  
  output += '## Visual Dependency Graph\n\n';
  output += 'This graph shows the relationships between endpoints, shared middleware, and external services.\n\n';
  output += generateMermaidGraph();
  
  output += generateDependencyMatrix();
  
  output += '\n## Legend\n\n';
  output += '- 🔵 **Blue nodes**: API Endpoints (Azure Functions)\n';
  output += '- 🟢 **Green node**: Shared middleware (azure-ai-utils.js)\n';
  output += '- 🟠 **Orange nodes**: External npm packages\n';
  output += '- 🔷 **Azure blue nodes**: Azure-specific services\n\n';
  
  output += '## How to View\n\n';
  output += 'The Mermaid diagram can be rendered in:\n';
  output += '- GitHub (automatic rendering in markdown files)\n';
  output += '- VS Code (with Mermaid extension)\n';
  output += '- [Mermaid Live Editor](https://mermaid.live)\n';
  
  if (options.output) {
    fs.writeFileSync(options.output, output);
    console.error(`✓ Graph written to: ${options.output}`);
  } else {
    console.log(output);
  }
}

// Run the generator
main();
