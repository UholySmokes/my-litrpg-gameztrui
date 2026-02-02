# Middleware Dependency Analysis Tools

This directory contains tools for analyzing the middleware architecture and dependencies in the Azure Functions API.

## Overview

The API uses a centralized middleware pattern where all endpoints depend on a shared utility module (`api/lib/azure-ai-utils.js`). These tools help understand and document those dependencies.

## Available Tools

### 1. Middleware Dependency Analyzer

**Script:** `scripts/analyze-middleware-dependencies.cjs`

Analyzes the Azure Functions API endpoints and generates comprehensive reports on:
- Shared middleware usage
- External service dependencies
- Configuration requirements (environment variables)
- Rate limiting configuration
- Security patterns

#### Usage

```bash
# Run analysis (text output to console)
npm run analyze:middleware

# Generate JSON report
npm run analyze:middleware:json

# Generate Markdown report
npm run analyze:middleware:md

# Custom usage
node scripts/analyze-middleware-dependencies.cjs [options]
```

#### Options

- `--format=json|text|markdown` - Output format (default: text)
- `--output=<file>` - Write to file instead of stdout
- `--verbose` - Include detailed analysis (e.g., all function imports per endpoint)

#### Examples

```bash
# View analysis in terminal
npm run analyze:middleware

# Save JSON report
npm run analyze:middleware:json -- --output=reports/middleware-$(date +%Y%m%d).json

# Generate detailed markdown report
node scripts/analyze-middleware-dependencies.cjs --format=markdown --verbose --output=docs/detailed-analysis.md
```

#### Output

The analyzer provides:

1. **Summary Statistics**
   - Total endpoints
   - Shared middleware functions
   - External dependencies
   - Required/optional environment variables

2. **Shared Middleware Analysis**
   - Exported functions from `azure-ai-utils.js`
   - External dependencies (npm packages)

3. **Per-Endpoint Analysis**
   - Route and HTTP methods
   - Authentication level
   - Middleware function usage count
   - External dependencies
   - Required environment variables
   - Optional environment variables (verbose mode)

4. **Host Configuration**
   - Azure Functions runtime version
   - Extension bundle configuration
   - Durable Functions storage provider

5. **Package Dependencies**
   - All npm dependencies with versions

---

### 2. Dependency Graph Generator

**Script:** `scripts/generate-dependency-graph.cjs`

Creates a visual dependency graph in Mermaid format showing relationships between endpoints, shared middleware, and external services.

#### Usage

```bash
# Generate graph and save to docs
npm run analyze:graph

# Custom usage
node scripts/generate-dependency-graph.cjs [options]
```

#### Options

- `--output=<file>` - Write to file instead of stdout (default: stdout)

#### Examples

```bash
# Generate and save to docs
npm run analyze:graph

# Output to console
node scripts/generate-dependency-graph.cjs

# Save to custom location
node scripts/generate-dependency-graph.cjs --output=reports/dependencies.md
```

#### Output

The generator creates:

1. **Visual Dependency Graph** (Mermaid diagram)
   - Color-coded nodes:
     - 🔵 Blue: API Endpoints
     - 🟢 Green: Shared middleware
     - 🟠 Orange: External npm packages
     - 🔷 Azure Blue: Azure-specific services
   - Connection labels showing function usage counts

2. **Dependency Matrix**
   - Tabular view of dependencies per endpoint
   - Quick reference for middleware, Azure Identity, Durable Functions, Redis usage

3. **Legend and Viewing Instructions**

#### Viewing the Graph

The generated Mermaid diagram can be viewed in:
- **GitHub** - Automatic rendering in markdown files
- **VS Code** - Install Mermaid extension
- **Mermaid Live Editor** - https://mermaid.live
- **GitLab** - Native support
- **Notion** - Embed code blocks with mermaid language

---

## Generated Documentation

These tools generate the following documentation files:

1. **`docs/MIDDLEWARE_DEPENDENCY_ANALYSIS.md`**
   - Comprehensive analysis document (manually created)
   - Architecture overview
   - Detailed endpoint documentation
   - Security patterns
   - Recommendations

2. **`docs/MIDDLEWARE_DEPENDENCY_GRAPH.md`**
   - Visual dependency graph (auto-generated)
   - Dependency matrix
   - Viewing instructions

---

## Integration with CI/CD

### GitHub Actions Example

Add to `.github/workflows/analyze.yml`:

```yaml
name: Middleware Analysis

on:
  push:
    branches: [main, develop]
  pull_request:
    paths:
      - 'api/**'

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Run Middleware Analysis
        run: |
          npm run analyze:middleware:json -- --output=middleware-report.json
          npm run analyze:graph
      
      - name: Upload Analysis Report
        uses: actions/upload-artifact@v3
        with:
          name: middleware-analysis
          path: |
            middleware-report.json
            docs/MIDDLEWARE_DEPENDENCY_GRAPH.md
```

### Pre-commit Hook Example

Add to `.husky/pre-commit` or `.git/hooks/pre-commit`:

```bash
#!/bin/sh

# Regenerate dependency graph if API files changed
if git diff --cached --name-only | grep -q "^api/"; then
  echo "API files changed, regenerating dependency graph..."
  npm run analyze:graph
  git add docs/MIDDLEWARE_DEPENDENCY_GRAPH.md
fi
```

---

## Development Workflow

### When to Run Analysis

Run middleware analysis when:

1. **Adding New Endpoints**
   - Verify middleware usage patterns
   - Document required environment variables
   - Update dependency graph

2. **Modifying Shared Middleware**
   - Check impact across all endpoints
   - Verify no breaking changes

3. **Reviewing Pull Requests**
   - Ensure consistent middleware usage
   - Verify proper dependency management

4. **Auditing Security**
   - Review authentication patterns
   - Check rate limiting configuration
   - Verify secure credential handling

5. **Onboarding New Developers**
   - Provide clear architecture overview
   - Document endpoint dependencies

### Recommended Workflow

```bash
# 1. Make changes to API
# ... edit api/*/index.js ...

# 2. Run analysis
npm run analyze:middleware

# 3. Generate graph
npm run analyze:graph

# 4. Review output
cat docs/MIDDLEWARE_DEPENDENCY_GRAPH.md

# 5. Commit changes
git add api/ docs/
git commit -m "feat: add new endpoint with proper middleware usage"
```

---

## Interpreting Results

### Red Flags to Watch For

❌ **Inconsistent Middleware Usage**
- Endpoint not using `azure-ai-utils.js` when others do
- Direct imports of external packages instead of using shared utilities

❌ **Missing Rate Limiting**
- Endpoint without rate limit configuration in public-facing APIs

❌ **Inconsistent Authentication**
- Endpoints with different `authLevel` settings without clear reason

❌ **Hardcoded Credentials**
- Environment variables not used for sensitive configuration

❌ **Missing Error Handling**
- Endpoints without proper try-catch blocks

### Good Patterns to Maintain

✅ **Consistent Middleware Usage**
- All endpoints import same set of utilities from `azure-ai-utils.js`

✅ **Managed Identity Authentication**
- Using `@azure/identity` and `DefaultAzureCredential`

✅ **Rate Limiting with Fallback**
- Redis primary, in-memory fallback

✅ **Environment-based Configuration**
- All configuration via environment variables
- Clear distinction between required and optional

✅ **Structured Error Responses**
- Using `jsonResponse()` for consistent format
- Proper HTTP status codes

---

## Troubleshooting

### Issue: Script not found

**Solution:**
```bash
# Ensure scripts are executable
chmod +x scripts/analyze-middleware-dependencies.cjs
chmod +x scripts/generate-dependency-graph.cjs
```

### Issue: Module not found errors

**Solution:**
```bash
# Ensure you're in the project root
cd /path/to/my-litrpg-gameztrui

# Check API directory exists
ls -la api/
```

### Issue: Empty or incorrect analysis

**Solution:**
```bash
# Verify API structure
ls -la api/*/index.js
ls -la api/*/function.json

# Check azure-ai-utils exists
cat api/lib/azure-ai-utils.js
```

### Issue: Mermaid diagram not rendering

**Solution:**
- GitHub: Ensure file has `.md` extension
- VS Code: Install "Markdown Preview Mermaid Support" extension
- Browser: Use [Mermaid Live Editor](https://mermaid.live)

---

## Extending the Tools

### Adding New Analysis Features

The analyzers are modular and can be extended:

1. **Custom Metrics**
   - Edit `scripts/analyze-middleware-dependencies.cjs`
   - Add new analysis functions
   - Include in report generation

2. **Additional Graph Types**
   - Edit `scripts/generate-dependency-graph.cjs`
   - Add new Mermaid diagram types (sequence, flowchart, etc.)

3. **Integration with Other Tools**
   - Export JSON format for processing
   - Pipe to other analysis tools
   - Generate custom reports

### Example: Adding Complexity Analysis

```javascript
// In analyze-middleware-dependencies.cjs

function analyzeComplexity(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return {
    lines: content.split('\n').length,
    functions: (content.match(/function /g) || []).length,
    complexity: calculateCyclomaticComplexity(content)
  };
}

// Add to endpoint analysis
endpoints.push({
  // ... existing properties
  complexity: analyzeComplexity(indexPath)
});
```

---

## Related Documentation

- [Middleware Dependency Analysis](../docs/MIDDLEWARE_DEPENDENCY_ANALYSIS.md) - Comprehensive analysis document
- [Middleware Dependency Graph](../docs/MIDDLEWARE_DEPENDENCY_GRAPH.md) - Visual dependency graph
- [API README](../api/README.md) - API documentation (if exists)
- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)

---

## Maintenance

### Updating Documentation

When API structure changes:

```bash
# 1. Run full analysis
npm run analyze:middleware:md -- --verbose --output=docs/analysis-update.md

# 2. Regenerate graph
npm run analyze:graph

# 3. Review and update main documentation
# Edit docs/MIDDLEWARE_DEPENDENCY_ANALYSIS.md as needed

# 4. Commit all changes
git add docs/ scripts/
git commit -m "docs: update middleware analysis"
```

### Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-02 | 1.0.0 | Initial release of analysis tools |

---

**Maintainer:** Development Team  
**Last Updated:** 2026-02-02
