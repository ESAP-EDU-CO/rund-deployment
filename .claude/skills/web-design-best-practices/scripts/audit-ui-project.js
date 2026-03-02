#!/usr/bin/env node

/**
 * audit-ui-project.js
 * Auditoria completa de proyecto web para mejores practicas de UI/UX
 *
 * Uso: node audit-ui-project.js <ruta-proyecto>
 * Ejemplo: node audit-ui-project.js ./mi-proyecto-web
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURACION
// ============================================================================

const CONFIG = {
  extensions: ['.html', '.htm', '.jsx', '.tsx', '.vue', '.css', '.scss', '.sass'],
  ignoreDirs: ['node_modules', 'dist', 'build', '.next', '.nuxt', 'coverage', '.git', 'vendor'],
  maxFileSize: 1024 * 1024, // 1MB
};

// ============================================================================
// REGLAS DE VALIDACION
// ============================================================================

const RULES = [
  // Accesibilidad
  {
    id: 'A001',
    name: 'Botones de icono sin aria-label',
    category: 'Accesibilidad',
    severity: 'critical',
    pattern: /<button[^>]*>[\s]*<(svg|img|i)[^>]*>[\s\S]*?<\/\1>[\s]*<\/button>/gi,
    antiPattern: true,
    exclude: /aria-label/,
    fileTypes: ['.html', '.jsx', '.tsx', '.vue'],
    message: 'Los botones que solo contienen iconos necesitan aria-label',
  },
  {
    id: 'A002',
    name: 'Inputs sin label asociado',
    category: 'Accesibilidad',
    severity: 'critical',
    pattern: /<input[^>]*(?!aria-label)[^>]*>/gi,
    antiPattern: true,
    customCheck: (content, match) => {
      if (/aria-label|aria-labelledby/.test(match)) return false;
      const idMatch = match.match(/id=["']([^"']+)["']/);
      if (!idMatch) return true;
      const labelPattern = new RegExp(`for=["']${idMatch[1]}["']`, 'i');
      return !labelPattern.test(content);
    },
    fileTypes: ['.html', '.jsx', '.tsx', '.vue'],
    message: 'Los inputs deben tener un label asociado o aria-label',
  },
  {
    id: 'A003',
    name: 'Imagenes sin alt',
    category: 'Accesibilidad',
    severity: 'critical',
    pattern: /<img(?![^>]*\balt=)[^>]*>/gi,
    antiPattern: true,
    fileTypes: ['.html', '.jsx', '.tsx', '.vue'],
    message: 'Las imagenes deben tener atributo alt',
  },
  {
    id: 'A004',
    name: 'Div/span con onClick sin accesibilidad',
    category: 'Accesibilidad',
    severity: 'critical',
    pattern: /<(div|span)[^>]*onClick[^>]*>/gi,
    antiPattern: true,
    exclude: /role=["'](button|link)["'].*tabindex|tabindex.*role=["'](button|link)["']/,
    fileTypes: ['.jsx', '.tsx', '.vue'],
    message: 'Elementos con onClick necesitan role y tabindex, o usar <button>',
  },

  // Focus
  {
    id: 'F001',
    name: 'outline:none sin reemplazo',
    category: 'Focus',
    severity: 'critical',
    pattern: /outline:\s*(none|0)[^;]*;/gi,
    antiPattern: true,
    customCheck: (content, match, fullContent, position) => {
      // Verificar si hay focus-visible o ring cerca
      const context = fullContent.substring(Math.max(0, position - 200), position + 200);
      return !/focus-visible|ring-|box-shadow/.test(context);
    },
    fileTypes: ['.css', '.scss', '.sass'],
    message: 'Nunca usar outline:none sin proporcionar un indicador de focus alternativo',
  },
  {
    id: 'F002',
    name: 'focus:outline-none sin ring en Tailwind',
    category: 'Focus',
    severity: 'critical',
    pattern: /class=["'][^"']*focus:outline-none(?![^"']*focus-visible:ring)[^"']*["']/gi,
    antiPattern: true,
    fileTypes: ['.html', '.jsx', '.tsx', '.vue'],
    message: 'focus:outline-none debe ir acompanado de focus-visible:ring-*',
  },

  // Formularios
  {
    id: 'FM001',
    name: 'Bloqueo de paste',
    category: 'Formularios',
    severity: 'critical',
    pattern: /onPaste\s*=.*preventDefault|onpaste\s*=.*return\s*false/gi,
    antiPattern: true,
    fileTypes: ['.html', '.jsx', '.tsx', '.vue'],
    message: 'Nunca bloquear la funcion de pegar en campos de formulario',
  },

  // Animaciones
  {
    id: 'AN001',
    name: 'transition: all',
    category: 'Animaciones',
    severity: 'warning',
    pattern: /transition:\s*all/gi,
    antiPattern: true,
    fileTypes: ['.css', '.scss', '.sass', '.html', '.jsx', '.tsx', '.vue'],
    message: 'Evitar transition: all, especificar propiedades explicitas',
  },
  {
    id: 'AN002',
    name: 'Animaciones sin reduced-motion',
    category: 'Animaciones',
    severity: 'warning',
    pattern: /animation:\s*[^;]+;/gi,
    antiPattern: true,
    customCheck: (content) => {
      return !/prefers-reduced-motion|motion-reduce/.test(content);
    },
    fileTypes: ['.css', '.scss', '.sass'],
    message: 'Las animaciones deben respetar prefers-reduced-motion',
  },

  // Imagenes
  {
    id: 'I001',
    name: 'Imagenes sin dimensiones',
    category: 'Imagenes',
    severity: 'critical',
    pattern: /<img[^>]*>/gi,
    antiPattern: true,
    customCheck: (content, match) => {
      return !/width=|height=/.test(match) && !/fill|layout=["']fill["']/.test(match);
    },
    fileTypes: ['.html', '.jsx', '.tsx', '.vue'],
    message: 'Las imagenes deben tener width y height explicitos para evitar CLS',
  },

  // Rendimiento
  {
    id: 'P001',
    name: 'Lista potencialmente larga sin virtualizacion',
    category: 'Rendimiento',
    severity: 'warning',
    pattern: /\.map\s*\(\s*\([^)]*\)\s*=>\s*[^)]*<(li|div|tr)/gi,
    antiPattern: true,
    customCheck: (content) => {
      return !/useVirtualizer|VirtualList|FixedSizeList|content-visibility/.test(content);
    },
    fileTypes: ['.jsx', '.tsx'],
    message: 'Considerar virtualizacion para listas largas (>50 items)',
  },

  // Modo Oscuro
  {
    id: 'D001',
    name: 'Falta color-scheme',
    category: 'Modo Oscuro',
    severity: 'warning',
    pattern: /\.dark\s*\{|dark:bg-|prefers-color-scheme:\s*dark/gi,
    antiPattern: false,
    customCheck: (content) => {
      return !/color-scheme/.test(content);
    },
    fileTypes: ['.css', '.scss', '.html'],
    message: 'Usar color-scheme: dark en el elemento html para modo oscuro',
  },

  // Viewport
  {
    id: 'VP001',
    name: 'Bloqueo de zoom',
    category: 'Accesibilidad',
    severity: 'critical',
    pattern: /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/gi,
    antiPattern: true,
    fileTypes: ['.html'],
    message: 'Nunca bloquear el zoom del usuario (user-scalable=no o maximum-scale=1)',
  },

  // Tailwind
  {
    id: 'TW001',
    name: 'Colores light sin variante dark',
    category: 'Tailwind CSS',
    severity: 'suggestion',
    pattern: /class=["'][^"']*bg-white(?![^"']*dark:bg)[^"']*["']/gi,
    antiPattern: true,
    fileTypes: ['.html', '.jsx', '.tsx', '.vue'],
    message: 'bg-white deberia tener su variante dark:bg-*',
  },
];

// ============================================================================
// UTILIDADES
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getAllFiles(dirPath, files = []) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (!CONFIG.ignoreDirs.includes(entry.name)) {
          getAllFiles(fullPath, files);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (CONFIG.extensions.includes(ext)) {
          const stats = fs.statSync(fullPath);
          if (stats.size <= CONFIG.maxFileSize) {
            files.push(fullPath);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error leyendo directorio ${dirPath}:`, error.message);
  }

  return files;
}

function analyzeFile(filePath, content) {
  const issues = [];
  const ext = path.extname(filePath).toLowerCase();

  for (const rule of RULES) {
    if (!rule.fileTypes.includes(ext)) continue;

    const matches = content.matchAll(rule.pattern);

    for (const match of matches) {
      let isIssue = rule.antiPattern;

      // Verificar exclusion
      if (rule.exclude && rule.exclude.test(match[0])) {
        isIssue = false;
      }

      // Verificacion personalizada
      if (rule.customCheck && isIssue) {
        isIssue = rule.customCheck(content, match[0], content, match.index);
      }

      if (isIssue) {
        const lines = content.substring(0, match.index).split('\n');
        const lineNumber = lines.length;

        issues.push({
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          severity: rule.severity,
          message: rule.message,
          file: filePath,
          line: lineNumber,
          match: match[0].substring(0, 100) + (match[0].length > 100 ? '...' : ''),
        });
      }
    }
  }

  return issues;
}

// ============================================================================
// REPORTE
// ============================================================================

function generateReport(allIssues, projectPath) {
  const stats = {
    total: allIssues.length,
    critical: allIssues.filter(i => i.severity === 'critical').length,
    warning: allIssues.filter(i => i.severity === 'warning').length,
    suggestion: allIssues.filter(i => i.severity === 'suggestion').length,
  };

  const byCategory = {};
  for (const issue of allIssues) {
    if (!byCategory[issue.category]) {
      byCategory[issue.category] = [];
    }
    byCategory[issue.category].push(issue);
  }

  console.log('\n');
  log('═══════════════════════════════════════════════════════════════', 'blue');
  log('   AUDITORIA DE UI/UX - WEB DESIGN BEST PRACTICES', 'bold');
  log('═══════════════════════════════════════════════════════════════', 'blue');
  log(`\n   Proyecto: ${projectPath}`, 'gray');
  log(`   Fecha: ${new Date().toLocaleString('es-ES')}\n`, 'gray');

  // Resumen
  log('┌─────────────────────────────────────────────────────────────┐', 'blue');
  log('│                         RESUMEN                            │', 'blue');
  log('├─────────────────────────────────────────────────────────────┤', 'blue');
  log(`│   Total de issues: ${String(stats.total).padEnd(40)}│`, 'blue');
  log(`│   ${colors.red}● Critical: ${String(stats.critical).padEnd(47)}${colors.blue}│`);
  log(`│   ${colors.yellow}● Warning: ${String(stats.warning).padEnd(48)}${colors.blue}│`);
  log(`│   ${colors.gray}● Suggestion: ${String(stats.suggestion).padEnd(45)}${colors.blue}│`);
  log('└─────────────────────────────────────────────────────────────┘\n', 'blue');

  // Issues por categoria
  for (const [category, issues] of Object.entries(byCategory)) {
    log(`\n▸ ${category} (${issues.length} issues)`, 'bold');
    log('─'.repeat(60), 'gray');

    for (const issue of issues.slice(0, 10)) {
      const severityColor = issue.severity === 'critical' ? 'red' :
                           issue.severity === 'warning' ? 'yellow' : 'gray';

      log(`  [${issue.severity.toUpperCase()}] ${issue.ruleName}`, severityColor);
      log(`    ${issue.file}:${issue.line}`, 'gray');
      log(`    ${issue.message}`, 'gray');
    }

    if (issues.length > 10) {
      log(`    ... y ${issues.length - 10} issues mas`, 'gray');
    }
  }

  // Puntuacion
  const maxScore = 100;
  const deductions = stats.critical * 10 + stats.warning * 3 + stats.suggestion * 1;
  const score = Math.max(0, maxScore - deductions);

  console.log('\n');
  log('═══════════════════════════════════════════════════════════════', 'blue');
  log(`   PUNTUACION FINAL: ${score}/100`, score >= 80 ? 'green' : score >= 50 ? 'yellow' : 'red');
  log('═══════════════════════════════════════════════════════════════', 'blue');

  if (score >= 80) {
    log('   ✓ Excelente! El proyecto sigue las mejores practicas.', 'green');
  } else if (score >= 50) {
    log('   ⚠ Aceptable, pero hay areas de mejora.', 'yellow');
  } else {
    log('   ✗ Se requieren mejoras significativas.', 'red');
  }

  console.log('\n');

  return stats;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    log('Uso: node audit-ui-project.js <ruta-proyecto>', 'yellow');
    log('Ejemplo: node audit-ui-project.js ./mi-proyecto-web', 'gray');
    process.exit(1);
  }

  const projectPath = path.resolve(args[0]);

  if (!fs.existsSync(projectPath)) {
    log(`Error: El directorio no existe: ${projectPath}`, 'red');
    process.exit(1);
  }

  log(`\nEscaneando proyecto: ${projectPath}...`, 'blue');

  const files = getAllFiles(projectPath);
  log(`Encontrados ${files.length} archivos para analizar.\n`, 'gray');

  const allIssues = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const issues = analyzeFile(file, content);
      allIssues.push(...issues);
    } catch (error) {
      log(`Error leyendo ${file}: ${error.message}`, 'red');
    }
  }

  const stats = generateReport(allIssues, projectPath);

  // Exit code basado en issues criticos
  process.exit(stats.critical > 0 ? 1 : 0);
}

main();
