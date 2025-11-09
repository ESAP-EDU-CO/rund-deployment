# Plan de Implementación - Demo Flujo OCR/AI/Ollama

**Fecha:** 5 de noviembre de 2025
**Objetivo:** Crear flujo de demostración para extracción de datos de documentos usando OCR, AI y Ollama
**Documentos demo:** Cédula de ciudadanía, Certificado laboral, Certificado académico

---

## 📋 Resumen Ejecutivo

El objetivo es adaptar el flujo existente de extracción de datos para que siga la nueva arquitectura:

```
Frontend (rund-mgp) → Backend (rund-api) → OCR (rund-ocr) → AI (rund-ai) → Ollama (rund-ollama/nuextract)
```

**Estado actual:**
```
Frontend → rund-api → rund-ocr → Ollama directo (mistral) ❌
```

**Estado deseado:**
```
Frontend → rund-api → rund-ocr → rund-ai → rund-ollama (nuextract) ✅
```

---

## 🎯 Cambios Requeridos por Componente

### 1. RUND-AI (Python/Flask)

**Archivos a modificar:**

#### 1.1. `/api/extract.py`
**Estado:** Implementado pero necesita ajuste del formato de entrada

**Cambio necesario:**
- Actualmente espera: `{"text": "...", "schema": "cedula"}`
- Necesita aceptar también: `{"text": "...", "tipo_documento": "documento_identidad"}`
- Mapear `tipo_documento` a nombres de schemas internos

**Código a agregar:**

```python
# Mapeo de tipos de documento del frontend a schemas internos
DOCUMENT_TYPE_MAPPING = {
    "documento_identidad": "cedula",
    "certificado_experiencia_laboral": "certificado_laboral",
    "certificado_academico": "certificado_academico",
    "hoja_vida": "cedula",  # Temporal
    # ... más mapeos según necesidad
}

@bp.route('/extract', methods=['POST'])
def extract():
    """Extrae datos estructurados de un documento"""
    try:
        data = request.json
        text = data.get('text')

        # Aceptar tanto 'schema' como 'tipo_documento'
        schema_name = data.get('schema')
        if not schema_name:
            tipo_documento = data.get('tipo_documento')
            schema_name = DOCUMENT_TYPE_MAPPING.get(tipo_documento, tipo_documento)

        if not text or not schema_name:
            return jsonify({
                "error": "Campos 'text' y 'schema'/'tipo_documento' son requeridos"
            }), 400

        extractor = get_extractor_service()
        result = extractor.extract(text, schema_name)
        return jsonify(result), 200

    except ValidationError as e:
        return jsonify({"error": "Validación fallida", "details": e.errors()}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

#### 1.2. `/config/settings.py`
**Estado:** Ya configurado correctamente

**Verificar:**
- `NUEXTRACT_MODEL = "nuextract"` ✅
- `OLLAMA_URL` apunta a `rund-ollama` ✅

**No requiere cambios.**

#### 1.3. `/config/schemas.py`
**Estado:** Ya implementado con los 3 schemas necesarios

**Schemas disponibles:**
- ✅ `CEDULA_SCHEMA` - Cédula de ciudadanía
- ✅ `CERTIFICADO_LABORAL_SCHEMA` - Certificado laboral
- ✅ `CERTIFICADO_ACADEMICO_SCHEMA` - Certificado académico

**No requiere cambios.**

#### 1.4. `/services/extractor_service.py`
**Estado:** Implementado correctamente, usa NuExtract

**No requiere cambios.**

---

### 2. RUND-API (PHP 8.3)

**Archivos a modificar:**

#### 2.1. `/app/src/Services/AIService.php`

**Cambios críticos:**

**Línea 79:** Cambiar URL de Ollama directo a rund-ai
```php
// ANTES (línea 79):
$aiUrl = $_ENV['AI_API_URL'] . '/api/generate';

// DESPUÉS:
$aiUrl = $_ENV['AI_API_URL'] . '/extract';
```

**Línea 30-43:** Modificar función `analizaDocumento` para usar rund-ai
```php
public static function analizaDocumento(
    string $filePath,
    string $tipoDocumento,
    array $datosExtraer
): array {
    // 1. OCR: Extraer texto del documento
    $ocrResult = self::extraerTextoDeDocumento($filePath);
    unlink($filePath);

    $extractedText = $ocrResult['text'] ?? null;

    if (!$extractedText) {
        return [
            'success' => false,
            'error' => 'No se pudo extraer texto del documento',
            'ocr_result' => $ocrResult
        ];
    }

    // 2. AI: Extraer datos estructurados usando rund-ai
    $startTime = microtime(true);
    $aiResult = self::extraerDatosConAI($extractedText, $tipoDocumento);
    $aiTime = (microtime(true) - $startTime) * 1000; // ms

    // 3. Construir respuesta completa
    return [
        'success' => $aiResult['success'] ?? false,
        'tipo_documento' => $tipoDocumento,
        'datos_extraidos' => $aiResult['data']['data'] ?? [],
        'confianza' => $aiResult['data']['validation']['is_valid'] ? 'alta' : 'baja',
        'procesamiento' => [
            'ocr_tiempo_ms' => $ocrResult['processing_time_ms'] ?? 0,
            'ai_tiempo_ms' => round($aiTime, 2),
            'tiempo_total_ms' => round(($ocrResult['processing_time_ms'] ?? 0) + $aiTime, 2)
        ],
        'texto_ocr' => $extractedText,
        'observaciones' => implode(', ', $aiResult['data']['validation']['errors'] ?? []),
        'metadata' => [
            'schema': $aiResult['data']['schema'] ?? $tipoDocumento,
            'elapsed_time_ai' => $aiResult['data']['elapsed_time'] ?? 0
        ]
    ];
}
```

**Nueva función:** `extraerDatosConAI`
```php
/**
 * Extrae datos estructurados usando rund-ai
 *
 * @param string $text Texto extraído por OCR
 * @param string $tipoDocumento Tipo de documento
 * @return array Resultado de la extracción
 */
public static function extraerDatosConAI(string $text, string $tipoDocumento): array
{
    $aiUrl = $_ENV['AI_API_URL'] . '/extract';

    $payload = [
        'text' => $text,
        'tipo_documento' => $tipoDocumento
    ];

    $jsonPayload = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if (json_last_error() !== JSON_ERROR_NONE) {
        return [
            'success' => false,
            'error' => 'Error al codificar JSON: ' . json_last_error_msg()
        ];
    }

    $curl = curl_init();
    $curlOptions = [
        CURLOPT_URL => $aiUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 120, // 2 minutos para procesamiento AI
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_POSTFIELDS => $jsonPayload,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Content-Length: ' . strlen($jsonPayload),
            'Accept: application/json'
        ],
    ];

    curl_setopt_array($curl, $curlOptions);

    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);

    if ($response === false) {
        return [
            'success' => false,
            'error' => "Error de cURL: {$curlError}"
        ];
    }

    if ($httpCode !== 200) {
        return [
            'success' => false,
            'error' => "Error HTTP {$httpCode}",
            'response' => $response
        ];
    }

    $decodedResult = json_decode($response, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        return [
            'success' => false,
            'error' => 'Error al decodificar respuesta: ' . json_last_error_msg(),
            'raw_response' => $response
        ];
    }

    return [
        'success' => true,
        'data' => $decodedResult
    ];
}
```

**Funciones a ELIMINAR o DEPRECAR:**
- `requestAI()` - Ya no se usa Ollama directo
- `construyeAiPayload()` - Ya no se necesita construir payload para Ollama
- `procesarRespuestaIA()` - Ya no se necesita parsear respuesta de Ollama
- `extraerJsonDeRespuesta()` - Ya no se necesita
- Todo el código relacionado con construcción de prompts (rund-ai lo maneja)

---

### 3. RUND-MGP (Angular/TypeScript)

**Archivos a modificar:**

#### 3.1. `/src/app/compartidos/componentes/extrae-datos/extrae-datos.ts`

**Cambios:**

1. **Agregar tipos para respuesta mejorada:**

```typescript
interface ProcesamientoInfo {
  ocr_tiempo_ms: number;
  ai_tiempo_ms: number;
  tiempo_total_ms: number;
}

interface RespuestaExtraccion {
  success: boolean;
  tipo_documento: string;
  datos_extraidos: any;
  confianza: 'alta' | 'media' | 'baja';
  procesamiento: ProcesamientoInfo;
  texto_ocr?: string;
  observaciones?: string;
}
```

2. **Actualizar método `enviaDocumento`:**

```typescript
enviaDocumento(ev: any): void {
  if (this.datos && this.documento) {
    this.cargando = true;
    this.error = null;

    const salida: Payload = this.transforma();
    const startTime = Date.now();

    this.dataServicio
      .extraeDatos('documento', this.documento, salida.tipoDocumento, salida.datosExtraer)
      .subscribe({
        next: (res: any) => {
          const endTime = Date.now();
          this.tiempoTotal = endTime - startTime;
          this.respuestaIA = res.extraccion || res;
          this.cargando = false;
        },
        error: (err: any) => {
          console.error('Error en extracción:', err);
          this.error = err.message || 'Error al procesar el documento';
          this.cargando = false;
        }
      });
  }
}
```

3. **Agregar propiedades al componente:**

```typescript
export class ExtraeDatos {
  // ... propiedades existentes ...

  cargando: boolean = false;
  error: string | null = null;
  tiempoTotal: number = 0;
  mostrarTextoOCR: boolean = false;
}
```

#### 3.2. `/src/app/compartidos/componentes/extrae-datos/extrae-datos.html`

**Mejoras en la UI:**

```html
<div class="extrae-datos">
  <div class="carga">
    <!-- Selector de tipo de documento -->
    <div class="selector">
      <div class="dropdown">
        <p-floatlabel class="label" variant="in">
          <p-select [(ngModel)]="datos"
                    class="select"
                    inputId="sel_doc"
                    [options]="listaDocumentos"
                    optionLabel="label" />
          <label for="sel_doc">Tipo de documento</label>
        </p-floatlabel>
      </div>

      @if (datos) {
      <div class="campos">
        <h4>Se intentará extraer los siguientes datos:</h4>
        <ul class="lista-campos">
          @for (campo of datos.campos; track $index) {
          <li>{{campo.label}}</li>
          }
        </ul>
      </div>
      }
    </div>

    <!-- File upload -->
    @if (datos) {
    <p-fileupload name="upDoc"
                  accept=".jpg,.jpeg,.pdf,.png"
                  maxFileSize="99999999"
                  (onSelect)="seleccionaDocumento($event)"
                  [disabled]="cargando">
      <!-- Template del header con botones -->
      <ng-template #header let-files let-chooseCallback="chooseCallback"
                   let-clearCallback="clearCallback">
        <div class="flex flex-wrap justify-between items-center flex-1 gap-4">
          <div class="flex gap-2">
            <p-button (onClick)="choose($event, chooseCallback)"
                      icon="pi pi-plus"
                      [rounded]="true"
                      [outlined]="true"
                      [disabled]="cargando" />
            <p-button (onClick)="enviaDocumento($event)"
                      icon="pi pi-cloud-upload"
                      [rounded]="true"
                      [outlined]="true"
                      severity="success"
                      [disabled]="!files || files.length === 0 || cargando"
                      [loading]="cargando" />
            <p-button (onClick)="clearCallback()"
                      icon="pi pi-times"
                      [rounded]="true"
                      [outlined]="true"
                      severity="danger"
                      [disabled]="!files || files.length === 0 || cargando" />
          </div>
        </div>
      </ng-template>

      <!-- Template del contenido -->
      <ng-template #content let-files>
        @if (files.length > 0) {
        <div class="documento">
          <div class="nombre">{{files[0].name}}</div>
          <div class="tamano">{{files[0].size | number}} bytes</div>
          <div class="tipo">{{files[0].type}}</div>
        </div>
        }
      </ng-template>
    </p-fileupload>
    }
  </div>

  <!-- Indicador de carga -->
  @if (cargando) {
  <div class="loading">
    <p-progressSpinner />
    <p>Procesando documento... Esto puede tomar unos segundos.</p>
  </div>
  }

  <!-- Error -->
  @if (error) {
  <p-message severity="error" [text]="error" />
  }

  <!-- Respuesta de la IA -->
  <div class="respuesta">
    @if (respuestaIA && !cargando) {
    <div class="resultado">
      <h3>Resultado de la Extracción</h3>

      <!-- Información general -->
      <div class="info-general">
        <div class="stat">
          <span class="label">Tipo de documento:</span>
          <span class="value">{{respuestaIA.tipo_documento}}</span>
        </div>
        <div class="stat">
          <span class="label">Confianza:</span>
          <span class="value" [class]="'confianza-' + respuestaIA.confianza">
            {{respuestaIA.confianza | uppercase}}
          </span>
        </div>
        <div class="stat">
          <span class="label">Tiempo total:</span>
          <span class="value">{{respuestaIA.procesamiento?.tiempo_total_ms | number:'1.0-0'}} ms</span>
        </div>
      </div>

      <!-- Tiempos de procesamiento -->
      <div class="tiempos">
        <h4>Tiempos de Procesamiento</h4>
        <div class="tiempo-item">
          <span>OCR:</span>
          <span>{{respuestaIA.procesamiento?.ocr_tiempo_ms | number:'1.0-0'}} ms</span>
        </div>
        <div class="tiempo-item">
          <span>IA (Extracción):</span>
          <span>{{respuestaIA.procesamiento?.ai_tiempo_ms | number:'1.0-0'}} ms</span>
        </div>
      </div>

      <!-- Datos extraídos -->
      <div class="datos-extraidos">
        <h4>Datos Extraídos</h4>
        <pre>{{respuestaIA.datos_extraidos | json}}</pre>
      </div>

      <!-- Observaciones -->
      @if (respuestaIA.observaciones) {
      <div class="observaciones">
        <h4>Observaciones</h4>
        <p>{{respuestaIA.observaciones}}</p>
      </div>
      }

      <!-- Texto OCR (opcional, colapsable) -->
      <div class="texto-ocr-section">
        <p-button (onClick)="mostrarTextoOCR = !mostrarTextoOCR"
                  [label]="mostrarTextoOCR ? 'Ocultar texto OCR' : 'Ver texto OCR'"
                  icon="pi pi-eye"
                  [text]="true" />

        @if (mostrarTextoOCR && respuestaIA.texto_ocr) {
        <div class="texto-ocr">
          <pre>{{respuestaIA.texto_ocr}}</pre>
        </div>
        }
      </div>
    </div>
    }
  </div>
</div>
```

#### 3.3. `/src/app/compartidos/componentes/extrae-datos/extrae-datos.scss`

**Estilos a agregar:**

```scss
.extrae-datos {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;

  .loading {
    text-align: center;
    padding: 3rem;

    p {
      margin-top: 1rem;
      color: var(--text-color-secondary);
    }
  }

  .respuesta {
    margin-top: 2rem;

    .resultado {
      background: var(--surface-card);
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);

      h3 {
        margin-bottom: 1.5rem;
        color: var(--primary-color);
      }

      .info-general {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;

          .label {
            font-weight: 600;
            color: var(--text-color-secondary);
            font-size: 0.9rem;
          }

          .value {
            font-size: 1.1rem;
            font-weight: bold;

            &.confianza-alta {
              color: var(--green-500);
            }

            &.confianza-media {
              color: var(--orange-500);
            }

            &.confianza-baja {
              color: var(--red-500);
            }
          }
        }
      }

      .tiempos {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: var(--surface-ground);
        border-radius: 6px;

        h4 {
          margin-bottom: 0.75rem;
          font-size: 1rem;
        }

        .tiempo-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--surface-border);

          &:last-child {
            border-bottom: none;
          }
        }
      }

      .datos-extraidos {
        margin-bottom: 1.5rem;

        h4 {
          margin-bottom: 0.75rem;
        }

        pre {
          background: var(--surface-ground);
          padding: 1rem;
          border-radius: 6px;
          overflow-x: auto;
          font-size: 0.9rem;
          line-height: 1.5;
        }
      }

      .observaciones {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: var(--yellow-50);
        border-left: 4px solid var(--yellow-500);
        border-radius: 4px;

        h4 {
          margin-bottom: 0.5rem;
          color: var(--yellow-900);
        }

        p {
          margin: 0;
          color: var(--yellow-800);
        }
      }

      .texto-ocr-section {
        .texto-ocr {
          margin-top: 1rem;
          max-height: 300px;
          overflow-y: auto;

          pre {
            background: var(--surface-ground);
            padding: 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            line-height: 1.4;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        }
      }
    }
  }
}
```

---

### 4. RUND-OCR (Python/Flask)

**Estado:** ✅ Ya funciona correctamente

**No requiere cambios.** El servicio OCR ya devuelve el texto extraído en el formato correcto.

---

### 5. RUND-Ollama

**Estado:** ✅ Ya funciona correctamente

**Verificar:**
- Modelo `nuextract` está descargado e instalado
- Puerto 11434 está accesible desde rund-ai

**Comando de verificación:**
```bash
docker exec rund-ollama ollama list
# Debe mostrar: nuextract
```

---

## 🔄 Flujo de Datos Completo

### Request Path (Frontend → Backend)

```json
// 1. Frontend envía documento
POST /api/v2/ai/extraer
Content-Type: multipart/form-data

{
  "accion": "documento",
  "documento": [archivo],
  "tipoDocumento": "documento_identidad",
  "datosExtraer": ["nombres", "apellidos", "numero_documento", ...]
}
```

```json
// 2. rund-api extrae texto con OCR
POST http://rund-ocr:8000/extract-text
Content-Type: multipart/form-data

{
  "file": [archivo]
}

// Respuesta OCR:
{
  "text": "REPUBLICA DE COLOMBIA\nCEDULA DE CIUDADANIA\n...",
  "confidence": 0.95,
  "processing_time_ms": 2500
}
```

```json
// 3. rund-api envía a rund-ai para extracción
POST http://rund-ai:8001/extract
Content-Type: application/json

{
  "text": "REPUBLICA DE COLOMBIA\nCEDULA DE CIUDADANIA\n...",
  "tipo_documento": "documento_identidad"
}

// Respuesta rund-ai:
{
  "success": true,
  "data": {
    "tipo_documento": "CC",
    "numero": "1234567890",
    "nombres": "JUAN CARLOS",
    "apellidos": "PEREZ GOMEZ",
    ...
  },
  "schema": "cedula",
  "validation": {
    "is_valid": true,
    "errors": []
  },
  "elapsed_time": 8.5
}
```

```json
// 4. rund-api construye respuesta final
{
  "success": true,
  "extraccion": {
    "success": true,
    "tipo_documento": "documento_identidad",
    "datos_extraidos": {
      "tipo_documento": "CC",
      "numero": "1234567890",
      "nombres": "JUAN CARLOS",
      "apellidos": "PEREZ GOMEZ",
      ...
    },
    "confianza": "alta",
    "procesamiento": {
      "ocr_tiempo_ms": 2500,
      "ai_tiempo_ms": 8500,
      "tiempo_total_ms": 11000
    },
    "texto_ocr": "REPUBLICA DE COLOMBIA...",
    "observaciones": ""
  },
  "documento": "cedula.pdf",
  "meta": {
    "accion": "extraer",
    "tipo_documento": "documento_identidad",
    "tamaño_archivo": 245678,
    "version": "2.0"
  }
}
```

---

## 🧪 Plan de Testing

### 1. Test Unitario - rund-ai

```bash
# Dentro del contenedor rund-ai
curl -X POST http://localhost:8001/extract \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "REPUBLICA DE COLOMBIA\nCEDULA DE CIUDADANIA\nNOMBRES: JUAN CARLOS\nAPELLIDOS: PEREZ GOMEZ\nNo. 1234567890",
    "tipo_documento": "documento_identidad"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "numero": "1234567890",
    "nombres": "JUAN CARLOS",
    "apellidos": "PEREZ GOMEZ",
    ...
  },
  "validation": {
    "is_valid": true,
    "errors": []
  }
}
```

### 2. Test Integración - rund-api → rund-ai

```bash
# Desde host o contenedor rund-api
curl -X POST http://rund-ai:8001/extract \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "TEXTO OCR AQUI...",
    "tipo_documento": "documento_identidad"
  }'
```

### 3. Test End-to-End - Frontend completo

1. Abrir `http://localhost:4000/herramientas` (o ruta del componente)
2. Seleccionar "Documento de identidad"
3. Cargar imagen de cédula
4. Click en "Procesar"
5. Verificar que se muestren los datos extraídos

---

## 📝 Checklist de Implementación

### Fase 1: Backend (rund-ai)
- [ ] Modificar `/api/extract.py` con mapeo de tipos de documento
- [ ] Probar endpoint `/extract` con curl
- [ ] Verificar que usa modelo `nuextract`
- [ ] Commit en rund-ai

### Fase 2: Backend (rund-api)
- [ ] Modificar `AIService.php::analizaDocumento()`
- [ ] Crear función `extraerDatosConAI()`
- [ ] Actualizar URL de AI_API_URL para apuntar a `/extract`
- [ ] Eliminar funciones obsoletas relacionadas con Ollama directo
- [ ] Probar con curl el endpoint `/api/v2/ai/extraer`
- [ ] Commit en rund-api

### Fase 3: Frontend (rund-mgp)
- [ ] Actualizar tipos TypeScript en `extrae-datos.ts`
- [ ] Mejorar método `enviaDocumento()` con manejo de estados
- [ ] Actualizar template HTML con nueva UI
- [ ] Agregar estilos SCSS
- [ ] Probar en navegador
- [ ] Commit en rund-mgp

### Fase 4: Testing End-to-End
- [ ] Probar con cédula de ciudadanía
- [ ] Probar con certificado laboral
- [ ] Probar con certificado académico
- [ ] Verificar tiempos de procesamiento
- [ ] Verificar UI responsive

### Fase 5: Documentación
- [ ] Actualizar CLAUDE.md si es necesario
- [ ] Crear documento de resultados de pruebas
- [ ] Screenshots de la demo funcionando

---

## 🚨 Puntos Críticos

### 1. Variables de Entorno
**Verificar en rund-api que:**
```env
AI_API_URL=http://rund-ai:8001
OCR_API_URL=http://rund-ocr:8000
OLLAMA_API_URL=http://rund-ollama:11434
```

### 2. Conectividad entre Servicios
**Todos los servicios deben estar en la misma red Docker:**
```yaml
networks:
  - rund-network
```

### 3. Timeouts
- OCR: 60 segundos (archivos grandes)
- AI: 120 segundos (modelos LLM pueden tardar)
- Total: Hasta 3 minutos por documento

### 4. Modelos de Ollama
**Verificar que estén descargados:**
```bash
docker exec rund-ollama ollama list
# Debe mostrar: nuextract
```

Si no está, descargar:
```bash
docker exec rund-ollama ollama pull nuextract
```

---

## 📊 Métricas Esperadas

### Tiempos de Procesamiento
- **OCR (PaddleOCR):** 2-5 segundos (documentos de 1-2 páginas)
- **AI (NuExtract):** 5-10 segundos (extracción estructurada)
- **Total:** 7-15 segundos por documento

### Precisión Esperada
- **Cédulas:** 95%+ (formato uniforme)
- **Certificados laborales:** 85-90% (formato variable)
- **Certificados académicos:** 85-90% (formato variable)

### Uso de Recursos
- **CPU:** Picos durante procesamiento OCR y AI
- **RAM rund-ai:** ~2GB (modelos cargados)
- **RAM rund-ocr:** ~1GB (PaddleOCR)
- **RAM rund-ollama:** ~4GB (NuExtract cargado)

---

## 🔍 Troubleshooting

### Problema: "Error al conectar con rund-ai"
**Solución:**
```bash
# Verificar que rund-ai esté corriendo
docker compose ps rund-ai

# Ver logs
docker compose logs -f rund-ai

# Verificar health
curl http://localhost:8001/health
```

### Problema: "No se pudo extraer JSON de la respuesta"
**Causa:** NuExtract a veces incluye texto adicional antes/después del JSON

**Solución:** La función `extract_json_from_response()` en `ollama_service.py` ya maneja esto

### Problema: "Timeout en procesamiento"
**Causa:** Documento muy grande o modelo lento

**Solución:** Aumentar timeouts en AIService.php:
```php
CURLOPT_TIMEOUT => 180, // 3 minutos
```

---

## ✅ Criterios de Éxito

La demo estará completa cuando:

1. ✅ Se pueda cargar un documento desde el frontend
2. ✅ El documento se procese con OCR correctamente
3. ✅ Los datos se extraigan con AI (NuExtract)
4. ✅ La respuesta se muestre en la UI con formato legible
5. ✅ Los tiempos de procesamiento sean razonables (< 30s)
6. ✅ La precisión de extracción sea > 85%
7. ✅ Se muestren los 3 tipos de documento: cédula, laboral, académico

---

## 📅 Timeline Estimado

- **Fase 1 (rund-ai):** 30 minutos
- **Fase 2 (rund-api):** 1 hora
- **Fase 3 (rund-mgp):** 1 hora
- **Fase 4 (Testing):** 30 minutos
- **Fase 5 (Documentación):** 30 minutos

**Total:** ~3.5 horas

---

**Documento generado:** 5 de noviembre de 2025
**Versión:** 1.0
**Autor:** Claude (asistido por RUND Development Team)
