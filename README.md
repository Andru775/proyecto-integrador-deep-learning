# ¿Verdad o tono? Detección de desinformación política en Colombia con RoBERTa-BNE

Proyecto Integrador de **Deep Learning** — Universidad Externado de Colombia, 2026
**Autor:** Nelson Andrey García Patarroyo

El proyecto replica el método de Blanco-Fernández et al. (2024) —ajuste de **RoBERTa-BNE** para detectar noticias falsas en español—, lo traslada a **134 afirmaciones colombianas verificadas** por fact-checkers y audita qué aprendió el modelo.

## Resultado en una línea

El modelo profundo **no supera de forma robusta** a una línea base TF-IDF + regresión logística, y la auditoría muestra que **responde al tono y al registro del texto más que a la veracidad**. Dictamen: la arquitectura profunda no se justificaba para este problema con estos datos.

| Conjunto | Modelo | AUC | MCC | F1 |
|---|---|---|---|---|
| Validación cruzada (107) | RoBERTa-BNE congelado + cabeza | 0,704 | 0,292 | 0,627 |
| | Línea base TF-IDF + RL | 0,730 | 0,392 | 0,652 |
| Prueba (27) | RoBERTa-BNE congelado + cabeza | 0,806 | 0,474 | 0,733 |
| | Línea base TF-IDF + RL | 0,644 | 0,236 | 0,500 |
| 134 fuera de muestra | RoBERTa-BNE congelado + cabeza | 0,726 | 0,324 | 0,652 |
| | Línea base TF-IDF + RL | 0,707 | 0,361 | 0,625 |

Diferencia de AUC con las 134 predicciones fuera de muestra: **0,018** (IC 95 % bootstrap: −0,076 a 0,118).

Hallazgos de la auditoría:
- **El tono pesa más que el hecho.** En 8 pares de afirmaciones de respuesta conocida, las falsas sobrias reciben en promedio p(verdadera) = 0,90 y las verdaderas sobrias 0,82; escribirlas en tono sensacionalista baja la probabilidad en 0,69–0,81 puntos.
- **Pasar el texto a minúsculas cambia el 23 % de las predicciones.** Los tokens en mayúsculas reciben 1,36 veces la saliencia que les tocaría por frecuencia.
- **Un modelo que solo ve fuente, medio y estilo** (sin el contenido) logra AUC 0,801 en validación cruzada, más que el Transformer.
- **Mal calibrado y sin noción de dominio:** ECE = 0,276; una frase en inglés o una cadena de letras al azar reciben p(verdadera) ≈ 1,00.
- **Falla más donde más daño hace:** el contenido suplantado se clasifica mal en el 71 % de los casos.

## Estructura

```
├── notebooks/
│   ├── 01_Fase1_linea_base.ipynb            # línea base TF-IDF + regresión logística (ejecutado)
│   ├── 02_Fase2_replicacion_traslado.ipynb  # réplica del artículo y traslado a Colombia (ejecutado en Colab, GPU T4)
│   └── 03_Fase3_auditoria.ipynb             # modelo final, explicabilidad, atajos, fallas (ejecutado en Colab, GPU T4)
├── src/baseline.py                          # línea base como script
├── resultados/
│   ├── fase2/                               # resultados.json, tablas y predicciones de la Fase 2
│   └── fase3/                               # resultados_fase3.json, tablas, predicciones y explicaciones por token
├── figuras/                                 # figuras de las fases 2 y 3
├── informe/                                 # informe final (Word y PDF)
├── presentacion/                            # diapositivas del video de sustentación (guion en las notas)
├── web/                                     # página del proyecto (estática, se despliega en Vercel)
├── data/README.md                           # cómo obtener y ubicar los datos
└── requirements.txt
```

## Cómo reproducir

1. **Datos:** coloca `fake_news_dataset.csv` (proporcionado en el curso) en `data/` o súbelo cuando el cuaderno lo pida. Para la réplica de la Fase 2 se usa además el corpus del artículo (`D57000_complete.csv`, Kaggle). Ver `data/README.md`.
2. **Fase 1** (CPU): `notebooks/01_Fase1_linea_base.ipynb` o `python src/baseline.py data/fake_news_dataset.csv`.
3. **Fases 2 y 3** (GPU): abre los cuadernos en Google Colab, activa una GPU T4 y ejecuta todas las celdas. La Fase 3 tarda unos 6 minutos y descarga `resultados_fase3.zip`.
4. Todas las fases usan la misma semilla (42) y la misma partición estratificada: 107 casos de desarrollo y 27 de prueba.

Entorno de ejecución: Python 3, PyTorch, Hugging Face Transformers y scikit-learn (versiones exactas registradas en cada `resultados*.json`).

## Página del proyecto

La carpeta `web/` es un sitio estático (HTML, CSS y JavaScript, sin compilación). Para publicarlo en Vercel: **Add New → Project → importar este repositorio → Root Directory: `web` → Framework Preset: Other → Deploy**.

## Decisiones técnicas principales

- **Modelo:** RoBERTa-BNE (125 M parámetros). Los pesos oficiales de PlanTL fueron retirados de Hugging Face en 2025; se usa la copia comunitaria `IsGarrido/roberta-base-bne`, verificada por suma SHA-256 y salidas de *fill-mask*.
- **Transferencia:** encoder congelado y cabeza entrenable (592.130 parámetros). El ajuste completo no aprendió con 107 ejemplos (Fase 2).
- **Selección sin fuga:** configuración, épocas y umbral se eligen solo con validación cruzada de 5 pliegues; la prueba se evalúa una vez.
- **Métricas:** F1 de la clase «verdadera» (métrica de la Fase 1), MCC y AUC; bootstrap pareado para las diferencias.
- **Herramientas:** se usó PyTorch + Hugging Face en lugar de TensorFlow/Keras porque el modelo preentrenado se distribuye en ese ecosistema.

## Referencias

- Blanco-Fernández, Y., Otero-Vizoso, J., Gil-Solla, A., & García-Duque, J. (2024). Enhancing misinformation detection in Spanish language with deep learning: BERT and RoBERTa transformer models. *Applied Sciences, 14*(21), 9729. https://doi.org/10.3390/app14219729
- Gutiérrez-Fandiño, A., et al. (2022). MarIA: Spanish language models. *Procesamiento del Lenguaje Natural, 68*, 39–60.

## Uso de inteligencia artificial

Se usó Claude (Anthropic) como herramienta de apoyo para escribir y depurar código, generar figuras, redactar borradores y construir la página web. Las decisiones técnicas, la interpretación de los resultados y la sustentación son responsabilidad del autor.
