# Datos

Los archivos de datos no se incluyen en el repositorio.

- **`fake_news_dataset.csv`** — 134 afirmaciones que circularon en Colombia, verificadas por Colombiacheck y otros verificadores. Fue proporcionado para el curso; el archivo completo (con usuarios y enlaces de cada publicación) no se publica aquí. Los textos de las afirmaciones, que ya son públicos en los chequeos, sí aparecen en `resultados/fase3/` porque son necesarios para revisar la auditoría. Colócalo en esta carpeta (o súbelo cuando el cuaderno lo pida). Separador `;`, codificación UTF-8.
  - `fake_news = True` significa que la afirmación es **verdadera** (verificado contra `link_verificador`); en los cuadernos `y = 1` es verdadera y `y = 0` falsa.
  - Solo `titulo` y `texto` entran al modelo. `tipo_noticia` y `tipologia_8P` solo están diligenciadas para las falsas (revelan la etiqueta) y nunca se usan como entrada; `fuente` y `medio` se usan únicamente para auditar atajos.
- **`D57000_complete.csv`** — corpus del artículo de Blanco-Fernández et al. (2024), 57.231 noticias políticas españolas, disponible en Kaggle. Solo se usa en la réplica de la Fase 2.
