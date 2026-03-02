#!/usr/bin/env node

/**
 * check-design-rules.js
 * Verificacion de archivo individual contra reglas de diseno UI/UX
 *
 * Uso: node check-design-rules.js <ruta-archivo>
 * Ejemplo: node check-design-rules.js src/components/Button.tsx
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// COLORES
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================================================
// REGLAS POR TIPO DE ARCHIVO
// ============================================================================

const rules = {
  html: [
    {
      id: 'HTML-A001',
      name: 'Imagen sin alt',
      severity: 'critical',
      check: (content) => {
        const matches = [];
        const regex = /<img(?![^>]*\balt=)[^>]*>/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
          matches.push({ line: getLineNumber(content, match.index), snippet: match[0] });
        }
        return matches;
      },
      fix: 'Agregar atributo alt a todas las imagenes',
    },
    {
      id: 'HTML-A002',
      name: 'Boton sin tipo',
      severity: 'warning',
      check: (content) => {
        const matches = [];
        const regex = /<button(?![^>]*\btype=)[^>]*>/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
          matches.push({ line: getLineNumber(content, match.index), snippet: match[0] });
        }
        return matches;
      },
      fix: 'Agregar type="button" o type="submit" a los botones',
    },
    {
      id: 'HTML-A003',
      name: 'Input sin label',
      severity: 'critical',
      check: (content) => {
        const matches = [];
        const regex = /<input[^>]*id=["']([^"']+)["'][^>]*>/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const id = match[1];
          if (!/aria-label|aria-labelledby/.test(match[0])) {
            const labelRegex = new RegExp(`for=["']${id}["']`, 'i');
            if (!labelRegex.test(content)) {
              matches.push({ line: getLineNumber(content, match.index), snippet: match[0] });
            }
          }
        }
        return matches;
      },
      fix: 'Asociar un label al input usando for/id o aria-label',
    },
    {
      id: 'HTML-VP001',
      name: 'Zoom bloqueado',
      severity: 'critical',
      check: (content) => {
        const matches = [];
        const regex = /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
          matches.push({ line: getLineNumber(content, match.index), snippet: match[0] });
        }
        return matches;
      },
      fix: 'Eliminar restricciones de zoom para accesibilidad',
    },
  ],

  jsx: [
    {
      id: 'JSX-A001',
      name: 'onClick sin onKeyDown',
      severity: 'critical',
      check: (content) => {
        const matches = [];
        const regex = /<(div|span)[^>]*onClick[^>]*>/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
          if (!/onKeyDown|onKeyUp|role=["'](button|link)["']/.test(match[0])) {
            matches.push({ line: getLineNumber(content, match.index), snippet: match[0] });
          }
        }
        return matches;
      },
      fix: 'Usar <button> o agregar onKeyDown, role y tabIndex',
    },
    {
      id: 'JSX-A002',
      name: 'Boton de icono sin aria-label',
      severity: 'critical',
      check: (content) => {
        const matches = [];
        const regex = /<button[^>]*>[\s\n]*<(svg|Icon|img)[^>]*\/?>/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const buttonStart = content.lastIndexOf('<button', match.index);
          const buttonEnd = content.indexOf('</button>', match.index);
          const buttonContent = content.substring(buttonStart, buttonEnd + 9);

          // Verificar si hay texto visible o aria-label
          if (!/aria-label|>[\w\s]+<\/button>/.test(buttonContent)) {
            matches.push({ line: getLineNumber(content, match.index), snippet: match[0] });
          }
        }
        return matches;
      },
      fix: 'Agregar aria-label al boton o incluir texto visible',
    },
    {
      id: 'JSX-F001',
      name: 'focus:outline-none sin ring',
      severity: 'critical',
      check: (content) => {
        const matches = [];
        const regex = /className=["'][^"']*focus:outline-none[^"']*["']/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
          if (!/focus-visible:ring|focus:ring/.test(match[0])) {
            matches.push({ line: getLineNumber(content, match.index), snippet: match[0] });
          }
        }
        return matches;
      },
      fix: 'Agregar focus-visible:ring-* junto a focus:outline-none',
    },
    {
      id: 'JSX-FM001',
      name: 'Bloqueo de paste',
      severity: 'critical',
      check: (content) => {
        const matches = [];
        const regex = /onPaste\s*=\s*\{[^}]*preventDefault/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
          matches.push({ line: getLineNumber(content, match.index), snippet: match[0] });
        }
        return matches;
      },
      fix: 'Nunca bloquear paste. Validar despues de pegar si es necesario',
    },
    {
      id: 'JSX-I001',
      name: 'Imagen sin dimensiones',
      severity: 'warning',
      check: (content) => {
        const matches = [];
        // Buscar <img> sin width/height y que no sea next/image con fill
        const regex = /<img[^>]+src=[^>]+>/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
          if (!/width=|height=|fill/.test(match[0])) {
            matches.push({ line: getLineNumber(content, match.index), snippet: match[0] });
          }
        }
        return matches;
      },
      fix: 'Agregar width y height a las imagenes para evitar CLS',
    },
    {
      id: 'JSX-TW001',
      name: 'bg-white sin dark:bg-*',
      severity: 'suggestion',
      check: (content) => {
        const matches = [];
        const regex = /className=["'][^"']*bg-white(?![^"']*dark:bg)[^"']*["']/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
          matches.push({ line: getLineNumber(content, match.index), snippet: match[0].substring(0, 80) });
        }
        return matches;
      },
      fix: 'Agregar variante dark:bg-* para modo oscuro',
    },
  ],

  css: [
    {
      id: 'CSS-F001',
      name: 'outline:none sin reemplazo',
      severity: 'critical',
      check: (content) => {
        const matches = [];
        const regex = /outline:\s*(none|0)[^;]*;/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
          // Verificar contexto
          const blockStart = content.lastIndexOf('{', match.index);
          const blockEnd = content.indexOf('}', match.index);
          const block = content.substring(blockStart, blockEnd);

          if (!/box-shadow|border-color|ring/.test(block) && !/focus-visible/.test(content.substring(blockStart - 50, blockStart))) {
            matches.push({ line: getLineNumber(content, match.index), snippet: match[0] });
          }
        }
        return matches;
      },
      fix: 'Proporcionar indicador de focus alternativo (box-shadow, border)',
    },
    {
      id: 'CSS-AN001',
      name: 'transition: all',
      severity: 'warning',
      check: (content) => {
        const matches = [];
        const regex = /transition:\s*all/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
          matches.push({ line: getLineNumber(content, match.index), snippet: match[0] });
        }
        return matches;
      },
      fix: 'Especificar propiedades explicitas en lugar de "all"',
    },
    {
      id: 'CSS-AN002',
      name: 'Animacion sin reduced-motion',
      severity: 'warning',
      check: (content) => {
        const matches = [];
        if (/animation:\s*[^;]+;/.test(content) && !/prefers-reduced-motion/.test(content)) {
          const regex = /animation:\s*[^;]+;/gi;
          let match;
          while ((match = regex.exec(content)) !== null) {
            matches.push({ line: getLineNumber(content, match.index), snippet: match[0] });
          }
        }
        return matches;
      },
      fix: 'Agregar @media (prefers-reduced-motion) para usuarios sensibles',
    },
    {
      id: 'CSS-AN003',
      name: 'Animando propiedades costosas',
      severity: 'warning',
      check: (content) => {
        const matches = [];
        const expensiveProps = /transition:[^;]*(width|height|top|left|right|bottom|margin|padding)[^;]*;/gi;
        let match;
        while ((match = expensiveProps.exec(content)) !== null) {
          matches.push({ line: getLineNumber(content, match.index), snippet: match[0] });
        }
        return matches;
      },
      fix: 'Usar transform en lugar de propiedades que causan reflow',
    },
  ],
};

// Aliases para extensiones
rules.tsx = rules.jsx;
rules.vue = rules.jsx;
rules.scss = rules.css;
rules.sass = rules.css;
rules.htm = rules.html;

// ============================================================================
// UTILIDADES
// ============================================================================

function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  return ext;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    log('\nUso: node check-design-rules.js <ruta-archivo>', 'yellow');
    log('Ejemplo: node check-design-rules.js src/components/Button.tsx\n', 'gray');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);

  if (!fs.existsSync(filePath)) {
    log(`\nError: El archivo no existe: ${filePath}\n`, 'red');
    process.exit(1);
  }

  const fileType = getFileType(filePath);
  const fileRules = rules[fileType];

  if (!fileRules) {
    log(`\nTipo de archivo no soportado: .${fileType}`, 'yellow');
    log('Tipos soportados: .html, .jsx, .tsx, .vue, .css, .scss\n', 'gray');
    process.exit(0);
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  console.log('\n');
  log('═══════════════════════════════════════════════════════════════', 'blue');
  log('   VERIFICACION DE REGLAS DE DISENO UI/UX', 'bold');
  log('═══════════════════════════════════════════════════════════════', 'blue');
  log(`\n   Archivo: ${filePath}`, 'gray');
  log(`   Tipo: ${fileType.toUpperCase()}\n`, 'gray');

  let totalIssues = 0;
  let criticalCount = 0;
  let warningCount = 0;
  let suggestionCount = 0;

  for (const rule of fileRules) {
    const issues = rule.check(content);

    if (issues.length > 0) {
      totalIssues += issues.length;

      const severityColor = rule.severity === 'critical' ? 'red' :
                           rule.severity === 'warning' ? 'yellow' : 'gray';

      if (rule.severity === 'critical') criticalCount += issues.length;
      else if (rule.severity === 'warning') warningCount += issues.length;
      else suggestionCount += issues.length;

      log(`\n[${rule.severity.toUpperCase()}] ${rule.id}: ${rule.name}`, severityColor);
      log('─'.repeat(60), 'gray');

      for (const issue of issues) {
        log(`  Linea ${issue.line}: ${issue.snippet.substring(0, 70)}...`, 'gray');
      }

      log(`\n  💡 Solucion: ${rule.fix}`, 'cyan');
    }
  }

  console.log('\n');
  log('═══════════════════════════════════════════════════════════════', 'blue');

  if (totalIssues === 0) {
    log('   ✓ No se encontraron problemas!', 'green');
  } else {
    log(`   Total: ${totalIssues} problemas encontrados`, totalIssues > 0 ? 'yellow' : 'green');
    if (criticalCount > 0) log(`   ● Critical: ${criticalCount}`, 'red');
    if (warningCount > 0) log(`   ● Warning: ${warningCount}`, 'yellow');
    if (suggestionCount > 0) log(`   ● Suggestion: ${suggestionCount}`, 'gray');
  }

  log('═══════════════════════════════════════════════════════════════\n', 'blue');

  process.exit(criticalCount > 0 ? 1 : 0);
}

main();
