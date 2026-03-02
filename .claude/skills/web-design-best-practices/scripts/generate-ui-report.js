#!/usr/bin/env node

/**
 * generate-ui-report.js
 * Generador de reportes de cumplimiento UI/UX en multiples formatos
 *
 * Uso:
 *   node generate-ui-report.js <ruta-proyecto>           # Terminal (default)
 *   node generate-ui-report.js <ruta-proyecto> --json    # JSON
 *   node generate-ui-report.js <ruta-proyecto> --html    # HTML
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURACION
// ============================================================================

const CONFIG = {
  extensions: ['.html', '.htm', '.jsx', '.tsx', '.vue', '.css', '.scss'],
  ignoreDirs: ['node_modules', 'dist', 'build', '.next', '.nuxt', '.git'],
  categories: {
    accesibilidad: { weight: 25, icon: '♿' },
    focus: { weight: 15, icon: '🎯' },
    formularios: { weight: 15, icon: '📝' },
    animaciones: { weight: 10, icon: '✨' },
    tipografia: { weight: 10, icon: '📖' },
    imagenes: { weight: 10, icon: '🖼️' },
    rendimiento: { weight: 10, icon: '⚡' },
    'modo-oscuro': { weight: 5, icon: '🌙' },
  },
};

// ============================================================================
// REGLAS SIMPLIFICADAS PARA CONTEO
// ============================================================================

const rules = [
  { id: 'A001', category: 'accesibilidad', pattern: /<img(?![^>]*\balt=)/gi, severity: 'critical' },
  { id: 'A002', category: 'accesibilidad', pattern: /user-scalable\s*=\s*no/gi, severity: 'critical' },
  { id: 'A003', category: 'accesibilidad', pattern: /<(div|span)[^>]*onClick(?![^>]*role)/gi, severity: 'critical' },
  { id: 'F001', category: 'focus', pattern: /outline:\s*(none|0)(?![^}]*box-shadow)/gi, severity: 'critical' },
  { id: 'F002', category: 'focus', pattern: /focus:outline-none(?![^"']*ring)/gi, severity: 'critical' },
  { id: 'FM001', category: 'formularios', pattern: /onPaste[^}]*preventDefault/gi, severity: 'critical' },
  { id: 'AN001', category: 'animaciones', pattern: /transition:\s*all/gi, severity: 'warning' },
  { id: 'AN002', category: 'animaciones', pattern: /animation:[^;]+;(?![^@]*prefers-reduced-motion)/gi, severity: 'warning' },
  { id: 'I001', category: 'imagenes', pattern: /<img(?![^>]*(width|height|fill))/gi, severity: 'warning' },
  { id: 'D001', category: 'modo-oscuro', pattern: /bg-white(?![^"']*dark:bg)/gi, severity: 'suggestion' },
];

// ============================================================================
// UTILIDADES
// ============================================================================

function getAllFiles(dirPath, files = []) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory() && !CONFIG.ignoreDirs.includes(entry.name)) {
        getAllFiles(fullPath, files);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (CONFIG.extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (e) { /* ignore */ }
  return files;
}

function analyzeProject(projectPath) {
  const files = getAllFiles(projectPath);
  const results = {
    totalFiles: files.length,
    filesWithIssues: 0,
    issuesByCategory: {},
    issuesBySeverity: { critical: 0, warning: 0, suggestion: 0 },
    complianceByCategory: {},
    topIssues: [],
  };

  // Inicializar categorias
  for (const cat of Object.keys(CONFIG.categories)) {
    results.issuesByCategory[cat] = 0;
  }

  const issueCount = {};

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      let fileHasIssues = false;

      for (const rule of rules) {
        const matches = content.match(rule.pattern);
        if (matches) {
          const count = matches.length;
          results.issuesByCategory[rule.category] += count;
          results.issuesBySeverity[rule.severity] += count;
          issueCount[rule.id] = (issueCount[rule.id] || 0) + count;
          fileHasIssues = true;
        }
      }

      if (fileHasIssues) results.filesWithIssues++;
    } catch (e) { /* ignore */ }
  }

  // Calcular compliance por categoria
  for (const [cat, config] of Object.entries(CONFIG.categories)) {
    const issues = results.issuesByCategory[cat];
    const maxIssuesForZero = files.length * 0.5; // 50% de archivos con issues = 0%
    const compliance = Math.max(0, Math.round(100 - (issues / maxIssuesForZero) * 100));
    results.complianceByCategory[cat] = Math.min(100, compliance);
  }

  // Top issues
  results.topIssues = Object.entries(issueCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, count }));

  // Score global
  let totalWeight = 0;
  let weightedScore = 0;
  for (const [cat, config] of Object.entries(CONFIG.categories)) {
    totalWeight += config.weight;
    weightedScore += results.complianceByCategory[cat] * config.weight;
  }
  results.globalScore = Math.round(weightedScore / totalWeight);

  return results;
}

// ============================================================================
// OUTPUTS
// ============================================================================

function outputJSON(results) {
  console.log(JSON.stringify(results, null, 2));
}

function outputHTML(results, projectPath) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte UI/UX - ${path.basename(projectPath)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .subtitle { color: #94a3b8; margin-bottom: 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
    .card { background: #1e293b; border-radius: 12px; padding: 1.5rem; }
    .card-title { font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
    .card-value { font-size: 2.5rem; font-weight: bold; }
    .score-high { color: #22c55e; }
    .score-mid { color: #eab308; }
    .score-low { color: #ef4444; }
    .progress-bar { height: 8px; background: #334155; border-radius: 4px; overflow: hidden; margin-top: 0.75rem; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 2rem; }
    .category-card { background: #1e293b; border-radius: 8px; padding: 1rem; }
    .category-name { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #94a3b8; }
    .category-score { font-size: 1.5rem; font-weight: bold; margin-top: 0.5rem; }
    .issues-list { margin-top: 2rem; }
    .issues-list h2 { font-size: 1.25rem; margin-bottom: 1rem; }
    .issue-item { display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #1e293b; border-radius: 8px; margin-bottom: 0.5rem; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge-critical { background: #7f1d1d; color: #fecaca; }
    .badge-warning { background: #713f12; color: #fef08a; }
    .badge-suggestion { background: #1e3a5f; color: #93c5fd; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Reporte de Cumplimiento UI/UX</h1>
    <p class="subtitle">Proyecto: ${path.basename(projectPath)} | ${new Date().toLocaleDateString('es-ES')}</p>

    <div class="grid">
      <div class="card">
        <div class="card-title">Puntuacion Global</div>
        <div class="card-value ${results.globalScore >= 80 ? 'score-high' : results.globalScore >= 50 ? 'score-mid' : 'score-low'}">
          ${results.globalScore}%
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${results.globalScore >= 80 ? 'score-high' : results.globalScore >= 50 ? 'score-mid' : 'score-low'}"
               style="width: ${results.globalScore}%; background: currentColor;"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Archivos Analizados</div>
        <div class="card-value">${results.totalFiles}</div>
        <p style="color: #94a3b8; margin-top: 0.5rem;">${results.filesWithIssues} con problemas</p>
      </div>
      <div class="card">
        <div class="card-title">Issues por Severidad</div>
        <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
          <span class="badge badge-critical">${results.issuesBySeverity.critical} Critical</span>
          <span class="badge badge-warning">${results.issuesBySeverity.warning} Warning</span>
          <span class="badge badge-suggestion">${results.issuesBySeverity.suggestion} Suggestion</span>
        </div>
      </div>
    </div>

    <div class="category-grid">
      ${Object.entries(results.complianceByCategory).map(([cat, score]) => `
        <div class="category-card">
          <div class="category-name">
            <span>${CONFIG.categories[cat]?.icon || '📋'}</span>
            <span>${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
          </div>
          <div class="category-score ${score >= 80 ? 'score-high' : score >= 50 ? 'score-mid' : 'score-low'}">
            ${score}%
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${score}%; background: ${score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'};"></div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="issues-list">
      <h2>Top Issues</h2>
      ${results.topIssues.map(issue => `
        <div class="issue-item">
          <span>${issue.id}</span>
          <span class="badge badge-critical">${issue.count} ocurrencias</span>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;

  console.log(html);
}

function outputText(results, projectPath) {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
  };

  const bar = (value, max = 100, width = 30) => {
    const filled = Math.round((value / max) * width);
    const empty = width - filled;
    const color = value >= 80 ? colors.green : value >= 50 ? colors.yellow : colors.red;
    return `${color}${'█'.repeat(filled)}${colors.gray}${'░'.repeat(empty)}${colors.reset}`;
  };

  console.log('\n');
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}   REPORTE DE CUMPLIMIENTO UI/UX${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.gray}   Proyecto: ${path.basename(projectPath)}${colors.reset}`);
  console.log(`${colors.gray}   Fecha: ${new Date().toLocaleString('es-ES')}${colors.reset}\n`);

  // Score global
  const scoreColor = results.globalScore >= 80 ? colors.green : results.globalScore >= 50 ? colors.yellow : colors.red;
  console.log(`   ${colors.bold}Puntuacion Global:${colors.reset} ${scoreColor}${results.globalScore}%${colors.reset}`);
  console.log(`   ${bar(results.globalScore)}\n`);

  // Estadisticas
  console.log(`${colors.blue}┌─────────────────────────────────────────────────────────────┐${colors.reset}`);
  console.log(`${colors.blue}│${colors.reset}  Archivos: ${results.totalFiles} total | ${results.filesWithIssues} con problemas             ${colors.blue}│${colors.reset}`);
  console.log(`${colors.blue}│${colors.reset}  Issues: ${colors.red}${results.issuesBySeverity.critical} critical${colors.reset} | ${colors.yellow}${results.issuesBySeverity.warning} warning${colors.reset} | ${colors.gray}${results.issuesBySeverity.suggestion} suggestion${colors.reset}   ${colors.blue}│${colors.reset}`);
  console.log(`${colors.blue}└─────────────────────────────────────────────────────────────┘${colors.reset}\n`);

  // Por categoria
  console.log(`${colors.bold}   Cumplimiento por Categoria:${colors.reset}\n`);
  for (const [cat, score] of Object.entries(results.complianceByCategory)) {
    const icon = CONFIG.categories[cat]?.icon || '📋';
    const name = cat.charAt(0).toUpperCase() + cat.slice(1);
    console.log(`   ${icon} ${name.padEnd(15)} ${bar(score, 100, 20)} ${score}%`);
  }

  // Top issues
  if (results.topIssues.length > 0) {
    console.log(`\n${colors.bold}   Top Issues:${colors.reset}`);
    for (const issue of results.topIssues) {
      console.log(`   ${colors.gray}•${colors.reset} ${issue.id}: ${issue.count} ocurrencias`);
    }
  }

  console.log('\n');
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log('\nUso: node generate-ui-report.js <ruta-proyecto> [--json|--html]');
    console.log('\nOpciones:');
    console.log('  --json    Output en formato JSON');
    console.log('  --html    Output en formato HTML');
    console.log('  (default) Output en terminal con colores\n');
    process.exit(0);
  }

  const projectPath = path.resolve(args[0]);
  const format = args.includes('--json') ? 'json' : args.includes('--html') ? 'html' : 'text';

  if (!fs.existsSync(projectPath)) {
    console.error(`Error: Directorio no encontrado: ${projectPath}`);
    process.exit(1);
  }

  const results = analyzeProject(projectPath);

  switch (format) {
    case 'json':
      outputJSON(results);
      break;
    case 'html':
      outputHTML(results, projectPath);
      break;
    default:
      outputText(results, projectPath);
  }
}

main();
