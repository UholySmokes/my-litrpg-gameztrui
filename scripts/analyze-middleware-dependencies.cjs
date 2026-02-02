#!/usr/bin/env node

/**
 * Middleware Dependency Analyzer
 * 
 * Analyzes the Azure Functions API endpoints and their middleware dependencies.
 * Generates reports on:
 * - Shared middleware usage
 * - External service dependencies
 * - Configuration requirements
 * - Rate limiting configuration
 * - Security patterns
 * 
 * Usage:
 *   node scripts/analyze-middleware-dependencies.js [options]
 * 
 * Options:
 *   --format=json|text|markdown  Output format (default: text)
 *   --output=<file>              Write to file instead of stdout
 *   --verbose                    Include detailed analysis
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_DIR = path.join(process.cwd(), 'api');
const SHARED_LIB = path.join(API_DIR, 'lib', 'azure-ai-utils.js');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  format: 'text',
  output: null,
  verbose: false
};

args.forEach(arg => {
  if (arg.startsWith('--format=')) {
    options.format = arg.split('=')[1];
  } else if (arg.startsWith('--output=')) {
    options.output = arg.split('=')[1];
  } else if (arg === '--verbose') {
    options.verbose = true;
  }
});

/**
 * Analyzes a JavaScript file for require/import statements
 */
function analyzeDependencies(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const dependencies = {
      internal: [],
      external: [],
      functions: []
    };

    // Match require statements
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

    // Match destructured imports from azure-ai-utils
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
 * Extracts environment variables from source code
 */
function extractEnvVars(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const envVars = [];
    
    // Match getRequiredEnv("VAR_NAME")
    const requiredRegex = /getRequiredEnv\(['"]([^'"]+)['"]\)/g;
    let match;
    while ((match = requiredRegex.exec(content)) !== null) {
      envVars.push({ name: match[1], required: true });
    }
    
    // Match getOptionalEnv("VAR_NAME")
    const optionalRegex = /getOptionalEnv\(['"]([^'"]+)['"][^\)]*\)/g;
    while ((match = optionalRegex.exec(content)) !== null) {
      envVars.push({ name: match[1], required: false });
    }
    
    // Match process.env.VAR_NAME
    const directRegex = /process\.env\.([A-Z_]+)/g;
    while ((match = directRegex.exec(content)) !== null) {
      if (!envVars.find(v => v.name === match[1])) {
        envVars.push({ name: match[1], required: false });
      }
    }
    
    return envVars;
  } catch (error) {
    return [];
  }
}

/**
 * Analyzes the shared middleware library
 */
function analyzeSharedMiddleware() {
  try {
    const content = fs.readFileSync(SHARED_LIB, 'utf8');
    
    // Extract exported functions
    const exportsMatch = content.match(/module\.exports\s+=\s+{([^}]+)}/);
    const exports = exportsMatch 
      ? exportsMatch[1].split(',').map(e => e.trim()).filter(e => e)
      : [];
    
    // Analyze dependencies
    const deps = analyzeDependencies(SHARED_LIB);
    
    return {
      exports,
      externalDependencies: deps?.external || [],
      internalDependencies: deps?.internal || []
    };
  } catch (error) {
    return null;
  }
}

/**
 * Analyzes all endpoints in the API directory
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
    const envVars = extractEnvVars(indexPath);
    
    endpoints.push({
      name: entry.name,
      path: functionDir,
      config,
      dependencies: deps,
      environmentVariables: envVars
    });
  }
  
  return endpoints;
}

/**
 * Analyzes host.json configuration
 */
function analyzeHostConfig() {
  const hostPath = path.join(API_DIR, 'host.json');
  try {
    const content = fs.readFileSync(hostPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Analyzes package.json dependencies
 */
function analyzePackageDependencies() {
  const packagePath = path.join(API_DIR, 'package.json');
  try {
    const content = fs.readFileSync(packagePath, 'utf8');
    const pkg = JSON.parse(content);
    return {
      name: pkg.name,
      version: pkg.version,
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {}
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generates a comprehensive analysis report
 */
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    sharedMiddleware: analyzeSharedMiddleware(),
    endpoints: analyzeEndpoints(),
    hostConfig: analyzeHostConfig(),
    packageInfo: analyzePackageDependencies()
  };
  
  // Calculate statistics
  report.statistics = {
    totalEndpoints: report.endpoints.length,
    totalSharedFunctions: report.sharedMiddleware?.exports.length || 0,
    externalDependencies: new Set(
      report.endpoints.flatMap(e => e.dependencies?.external || [])
        .concat(report.sharedMiddleware?.externalDependencies || [])
    ).size,
    requiredEnvVars: new Set(
      report.endpoints.flatMap(e => 
        e.environmentVariables.filter(v => v.required).map(v => v.name)
      )
    ).size,
    optionalEnvVars: new Set(
      report.endpoints.flatMap(e => 
        e.environmentVariables.filter(v => !v.required).map(v => v.name)
      )
    ).size
  };
  
  return report;
}

/**
 * Formats report as text
 */
function formatAsText(report) {
  let output = '';
  
  output += '═══════════════════════════════════════════════════════════\n';
  output += '  MIDDLEWARE DEPENDENCY ANALYSIS REPORT\n';
  output += '═══════════════════════════════════════════════════════════\n';
  output += `Generated: ${report.timestamp}\n\n`;
  
  // Statistics
  output += '─────────────────────────────────────────────────────────\n';
  output += 'SUMMARY STATISTICS\n';
  output += '─────────────────────────────────────────────────────────\n';
  output += `Total Endpoints:           ${report.statistics.totalEndpoints}\n`;
  output += `Shared Middleware Functions: ${report.statistics.totalSharedFunctions}\n`;
  output += `External Dependencies:     ${report.statistics.externalDependencies}\n`;
  output += `Required Env Variables:    ${report.statistics.requiredEnvVars}\n`;
  output += `Optional Env Variables:    ${report.statistics.optionalEnvVars}\n\n`;
  
  // Shared Middleware
  output += '─────────────────────────────────────────────────────────\n';
  output += 'SHARED MIDDLEWARE (azure-ai-utils.js)\n';
  output += '─────────────────────────────────────────────────────────\n';
  if (report.sharedMiddleware) {
    output += `Exported Functions (${report.sharedMiddleware.exports.length}):\n`;
    report.sharedMiddleware.exports.forEach(fn => {
      output += `  • ${fn}\n`;
    });
    output += `\nExternal Dependencies:\n`;
    report.sharedMiddleware.externalDependencies.forEach(dep => {
      output += `  • ${dep}\n`;
    });
  }
  output += '\n';
  
  // Endpoints
  output += '─────────────────────────────────────────────────────────\n';
  output += 'ENDPOINT ANALYSIS\n';
  output += '─────────────────────────────────────────────────────────\n';
  report.endpoints.forEach(endpoint => {
    output += `\n📍 ${endpoint.name.toUpperCase()}\n`;
    if (endpoint.config) {
      output += `   Route:      ${endpoint.config.methods.join(', ')} /api/${endpoint.config.route}\n`;
      output += `   Auth Level: ${endpoint.config.authLevel}\n`;
    }
    
    if (endpoint.dependencies?.functions?.length > 0) {
      output += `   Middleware: Uses ${endpoint.dependencies.functions.length} functions from azure-ai-utils\n`;
      if (options.verbose) {
        endpoint.dependencies.functions.forEach(fn => {
          output += `               - ${fn}\n`;
        });
      }
    }
    
    if (endpoint.dependencies?.external?.length > 0) {
      output += `   External:   ${endpoint.dependencies.external.join(', ')}\n`;
    }
    
    const requiredVars = endpoint.environmentVariables.filter(v => v.required);
    const optionalVars = endpoint.environmentVariables.filter(v => !v.required);
    
    if (requiredVars.length > 0) {
      output += `   Required Env:\n`;
      requiredVars.forEach(v => {
        output += `               - ${v.name}\n`;
      });
    }
    
    if (options.verbose && optionalVars.length > 0) {
      output += `   Optional Env:\n`;
      optionalVars.forEach(v => {
        output += `               - ${v.name}\n`;
      });
    }
  });
  output += '\n';
  
  // Host Configuration
  if (report.hostConfig) {
    output += '─────────────────────────────────────────────────────────\n';
    output += 'HOST CONFIGURATION\n';
    output += '─────────────────────────────────────────────────────────\n';
    output += `Runtime Version: ${report.hostConfig.version}\n`;
    if (report.hostConfig.extensionBundle) {
      output += `Extension Bundle: ${report.hostConfig.extensionBundle.id}\n`;
      output += `Bundle Version: ${report.hostConfig.extensionBundle.version}\n`;
    }
    if (report.hostConfig.extensions?.durableTask) {
      output += `Durable Functions: ${report.hostConfig.extensions.durableTask.storageProvider.type}\n`;
    }
    output += '\n';
  }
  
  // Package Dependencies
  if (report.packageInfo) {
    output += '─────────────────────────────────────────────────────────\n';
    output += 'PACKAGE DEPENDENCIES\n';
    output += '─────────────────────────────────────────────────────────\n';
    Object.entries(report.packageInfo.dependencies).forEach(([name, version]) => {
      output += `  ${name.padEnd(30)} ${version}\n`;
    });
    output += '\n';
  }
  
  output += '═══════════════════════════════════════════════════════════\n';
  
  return output;
}

/**
 * Formats report as markdown
 */
function formatAsMarkdown(report) {
  let output = '';
  
  output += '# Middleware Dependency Analysis Report\n\n';
  output += `**Generated:** ${report.timestamp}\n\n`;
  
  // Statistics
  output += '## Summary Statistics\n\n';
  output += `| Metric | Count |\n`;
  output += `|--------|-------|\n`;
  output += `| Total Endpoints | ${report.statistics.totalEndpoints} |\n`;
  output += `| Shared Middleware Functions | ${report.statistics.totalSharedFunctions} |\n`;
  output += `| External Dependencies | ${report.statistics.externalDependencies} |\n`;
  output += `| Required Env Variables | ${report.statistics.requiredEnvVars} |\n`;
  output += `| Optional Env Variables | ${report.statistics.optionalEnvVars} |\n\n`;
  
  // Shared Middleware
  output += '## Shared Middleware (`azure-ai-utils.js`)\n\n';
  if (report.sharedMiddleware) {
    output += `### Exported Functions (${report.sharedMiddleware.exports.length})\n\n`;
    report.sharedMiddleware.exports.forEach(fn => {
      output += `- \`${fn}\`\n`;
    });
    output += `\n### External Dependencies\n\n`;
    report.sharedMiddleware.externalDependencies.forEach(dep => {
      output += `- \`${dep}\`\n`;
    });
    output += '\n';
  }
  
  // Endpoints
  output += '## Endpoint Analysis\n\n';
  report.endpoints.forEach(endpoint => {
    output += `### ${endpoint.name}\n\n`;
    if (endpoint.config) {
      output += `- **Route:** \`${endpoint.config.methods.join(', ')} /api/${endpoint.config.route}\`\n`;
      output += `- **Auth Level:** \`${endpoint.config.authLevel}\`\n`;
    }
    
    if (endpoint.dependencies?.functions?.length > 0) {
      output += `- **Middleware Usage:** ${endpoint.dependencies.functions.length} functions from azure-ai-utils\n`;
      if (options.verbose) {
        endpoint.dependencies.functions.forEach(fn => {
          output += `  - \`${fn}\`\n`;
        });
      }
    }
    
    if (endpoint.dependencies?.external?.length > 0) {
      output += `- **External Dependencies:** ${endpoint.dependencies.external.map(d => `\`${d}\``).join(', ')}\n`;
    }
    
    const requiredVars = endpoint.environmentVariables.filter(v => v.required);
    const optionalVars = endpoint.environmentVariables.filter(v => !v.required);
    
    if (requiredVars.length > 0) {
      output += `- **Required Environment Variables:**\n`;
      requiredVars.forEach(v => {
        output += `  - \`${v.name}\`\n`;
      });
    }
    
    if (options.verbose && optionalVars.length > 0) {
      output += `- **Optional Environment Variables:**\n`;
      optionalVars.forEach(v => {
        output += `  - \`${v.name}\`\n`;
      });
    }
    
    output += '\n';
  });
  
  // Host Configuration
  if (report.hostConfig) {
    output += '## Host Configuration\n\n';
    output += `- **Runtime Version:** ${report.hostConfig.version}\n`;
    if (report.hostConfig.extensionBundle) {
      output += `- **Extension Bundle:** ${report.hostConfig.extensionBundle.id}\n`;
      output += `- **Bundle Version:** ${report.hostConfig.extensionBundle.version}\n`;
    }
    if (report.hostConfig.extensions?.durableTask) {
      output += `- **Durable Functions:** ${report.hostConfig.extensions.durableTask.storageProvider.type}\n`;
    }
    output += '\n';
  }
  
  // Package Dependencies
  if (report.packageInfo) {
    output += '## Package Dependencies\n\n';
    output += '| Package | Version |\n';
    output += '|---------|----------|\n';
    Object.entries(report.packageInfo.dependencies).forEach(([name, version]) => {
      output += `| \`${name}\` | ${version} |\n`;
    });
    output += '\n';
  }
  
  return output;
}

/**
 * Main execution
 */
function main() {
  console.error('Analyzing middleware dependencies...\n');
  
  const report = generateReport();
  
  let output;
  if (options.format === 'json') {
    output = JSON.stringify(report, null, 2);
  } else if (options.format === 'markdown') {
    output = formatAsMarkdown(report);
  } else {
    output = formatAsText(report);
  }
  
  if (options.output) {
    fs.writeFileSync(options.output, output);
    console.error(`✓ Report written to: ${options.output}`);
  } else {
    console.log(output);
  }
}

// Run the analyzer
main();
