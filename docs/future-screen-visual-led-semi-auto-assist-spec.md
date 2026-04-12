# ТЗ: полуавтоматический режим помощи при размещении LED-экрана на фото
**Проект:** Future Screen / `visual-led`  
**Документ:** Техническое задание на реализацию semi-auto perspective assist  
**Версия:** 1.0

---

## 1. Цель

Реализовать в проекте `https://future-screen.vercel.app/visual-led` полуавтоматический режим помощи, который ускоряет размещение LED-экрана на фотографии площадки и повышает правдоподобность результата.

Система не должна пытаться “сама всё понять”. Правильная цель — дать пользователю инструмент, который:
- помогает определить перспективу сцены/площадки;
- помогает соблюдать масштаб;
- предлагает стартовую геометрию для размещения экрана;
- позволяет быстро вручную скорректировать результат;
- в финале накладывает экран с корректной перспективной деформацией.

---

## 2. Что именно нужно сделать

Нужно добавить в `visual-led` полуавтоматический режим помощи поверх текущего ручного сценария.

### Целевой UX
1. Пользователь загружает фото.
2. Пользователь задаёт масштаб через 2 точки и реальное расстояние между ними.
3. Система анализирует изображение и пытается понять направления перспективы.
4. Система показывает пользователю:
   - найденные линии;
   - вероятные направления перспективы;
   - вспомогательную сетку / направляющие;
   - стартовый четырёхугольник под экран.
5. Пользователь:
   - принимает предложенную геометрию;
   - либо двигает 4 точки вручную.
6. Система натягивает экран на целевую область через projective transform / homography.
7. Пользователь при необходимости корректирует размер, положение, углы и экспортирует результат.

---

## 3. Главный принцип

### Нельзя делать
Нельзя строить продукт на обещании: “алгоритм сам поймёт, куда поставить экран на любой фотографии”.

### Нужно делать
Строить продукт по принципу: “система подсказывает плоскость и перспективу, пользователь подтверждает”.

Это оптимальный баланс:
- реалистично по срокам;
- стабильно по качеству;
- понятно по UX;
- подходит для ваших кейсов.

---

## 4. Scope первой реализации

### Входит
- ручная калибровка масштаба;
- анализ фото на линии и направления перспективы;
- оценка dominant vanishing directions;
- отображение assist overlay;
- предложение стартового quadrilateral для экрана;
- ручная корректировка 4 точек;
- homography-based warping экрана;
- сохранение параметров в проекте;
- экспорт результата.

### Не входит
- полноценное автоматическое понимание глубины сцены;
- 3D-реконструкция;
- auto-placement без участия пользователя;
- физически корректный свет;
- full AI scene understanding;
- автоматический occlusion/matting behind foreground objects.

---

## 5. Бизнес-результат

После реализации менеджер или дизайнер должен:
- получать стартовую компоновку быстрее;
- реже рисовать на глаз;
- быстрее показывать клиенту 2–3 варианта;
- тратить меньше времени на ручную подгонку перспективы;
- получать визуализации, которые выглядят убедительнее.

---

## 6. Пользовательские сценарии

### Сценарий A — стандартный
1. Открыть `visual-led`.
2. Загрузить фото площадки.
3. Перейти в режим **Perspective Assist**.
4. Указать 2 точки известного расстояния на фото.
5. Ввести расстояние в метрах.
6. Нажать `Analyze photo`.
7. Система строит вспомогательные линии и перспективную подсказку.
8. Система предлагает стартовое положение LED-экрана.
9. Пользователь вручную корректирует 4 точки.
10. Пользователь применяет экран.
11. Пользователь экспортирует результат.

### Сценарий B — fallback
Если анализ фото не дал нормального результата:
1. Пользователь отключает assist.
2. Ставит 4 точки вручную.
3. Система всё равно делает корректный perspective warp.

---

## 7. UX-режимы

### 7.1 Manual placement
Пользователь сам задаёт 4 точки и сам контролирует перспективу. Это fallback и обязательный базовый режим.

### 7.2 Perspective assist
Система:
- анализирует фото;
- показывает линии;
- показывает направления перспективы;
- предлагает стартовую плоскость.

Пользователь подтверждает и правит. Это основной целевой режим.

### 7.3 Scale assist
Пользователь задаёт референсную длину.
Система вычисляет масштаб в выбранной плоскости и помогает подогнать реальный размер экрана.

---

## 8. Архитектура алгоритма

### 8.1 Входные данные
**Input**
- исходное фото;
- ширина/высота экрана в метрах;
- 2 reference points для масштаба;
- реальная длина между reference points;
- опционально: пользовательский грубый anchor region;
- asset экрана.

**Output**
- quadrilateral placement;
- homography matrix;
- warped screen preview;
- overlay of perspective guides;
- scene state for saving.

---

## 9. Алгоритмический pipeline

### Шаг 1. Preprocessing
Подготовить изображение для анализа:
- downscale для быстрого анализа;
- grayscale copy;
- contrast normalization;
- optional denoise;
- optional CLAHE/local contrast enhancement.

### Шаг 2. Edge / line detection
Найти сильные линейные структуры на изображении.

**Допустимые варианты**
- Canny edge detection + Probabilistic Hough Transform
- LSD (Line Segment Detector)
- EDLines
- OpenCV line detection pipeline

**Рекомендация**
Для первой версии:
- LSD или Probabilistic Hough;
- сравнить на реальных кейсах Future Screen.

**Выход**
Список line segments:
- start point
- end point
- length
- angle
- confidence / score

### Шаг 3. Фильтрация линий
Нужно отфильтровать:
- очень короткие;
- шумовые;
- случайные;
- дублирующиеся;
- линии со слабой стабильностью.

**Полезные критерии**
- длина;
- близость угла к dominant bins;
- контрастность;
- положение на сцене;
- принадлежность к области предполагаемой рабочей зоны.

### Шаг 4. Оценка dominant directions
Сгруппировать линии по направлениям:
- примерно вертикальные;
- первое горизонтальное направление;
- второе горизонтальное направление.

**Методы**
- clustering by angle;
- histogram peak bins;
- RANSAC over direction hypotheses;
- vanishing point estimation from intersections.

**Результат**
- dominant vertical direction;
- dominant ground-plane direction 1;
- dominant ground-plane direction 2;
- candidate vanishing points.

### Шаг 5. Vanishing point estimation
По группам линий вычислить кандидаты точек схода.

**Что сделать**
- продлить линии;
- вычислить пересечения;
- кластеризовать пересечения;
- выбрать устойчивые vanishing point candidates.

**Выход**
- `vp_x`
- `vp_y`
- `vp_vertical`
- confidence score

Если confidence низкий, система не должна делать вид, что всё поняла. Нужно показать weak assist и оставить пользователю ручной режим.

### Шаг 6. Построение perspective guide overlay
Если dominant directions найдены с приемлемой уверенностью:
- показать вспомогательную сетку;
- показать сходящиеся направляющие;
- показать ориентировочную плоскость.

### Шаг 7. Scale calibration
Пользователь указывает 2 точки и реальную длину между ними.

Это даёт локальный масштаб в выбранной плоскости, а не глобальный метр на весь кадр.

**Использование**
- оценить размер стартового прямоугольника экрана;
- помочь выставить правильную ширину/высоту;
- избежать очевидно нереалистичного масштаба.

### Шаг 8. Стартовый quadrilateral proposal
После перспективного анализа и scale calibration система должна предложить стартовый quadrilateral.

**Рекомендованный UX**
Пользователь грубо рисует bbox / area, система вписывает экран в эту область с учётом перспективы.

### Шаг 9. Manual correction
После автоматического предложения пользователь обязан иметь возможность:
- двигать каждый из 4 углов;
- двигать весь quadrilateral;
- масштабировать;
- reset proposal;
- re-run assist;
- lock aspect ratio;
- unlock aspect ratio.

### Шаг 10. Homography / perspective warp
Когда 4 target points определены, система должна:
- вычислить матрицу projective transform;
- деформировать изображение экрана;
- отрисовать warped preview;
- использовать те же параметры при экспорте.

---

## 10. Техническая рекомендация по стеку

### Frontend
- React / Next.js
- TypeScript
- Canvas/WebGL layer
- `react-konva` или `fabric.js` для редактора
- custom perspective transform layer

### Image analysis
**Вариант 1 — на клиенте**
- OpenCV.js
- Web Workers

**Вариант 2 — на сервере**
- Python + OpenCV
- FastAPI / internal service
- results return as JSON

**Рекомендация**
Для текущего проекта разумнее:
- анализ фото вынести на сервер;
- UI и редактор оставить на клиенте.

Почему:
- OpenCV.js на клиенте тяжелее и капризнее;
- серверный pipeline легче контролировать и дебажить;
- проще улучшать алгоритм без фронтового ада;
- проще логировать качество.

---

## 11. Рекомендуемая системная архитектура

### Frontend responsibilities
- upload photo;
- collect reference points;
- collect rough target area;
- display overlay;
- let user adjust quadrilateral;
- preview warped screen;
- save scene state.

### Backend responsibilities
- preprocess image;
- run line detection;
- estimate vanishing points;
- produce assist model;
- return:
  - candidate lines
  - guide directions
  - confidence
  - suggested quadrilateral(s)

---

## 12. API design

### 12.1 Analyze photo
`POST /api/visual-led/analyze`

**Request**
- image
- optional userHintRegion
- optional scalePoints
- optional scaleDistanceMeters
- targetScreenWidthMeters
- targetScreenHeightMeters

**Response**
```json
{
  "status": "ok",
  "confidence": 0.78,
  "dominantLines": [],
  "vanishingPoints": {
    "vp1": [1234, 220],
    "vp2": [-640, 310],
    "vpVertical": [810, -2200]
  },
  "guideGrid": [],
  "suggestedQuadrilateral": [
    [520, 410],
    [1040, 430],
    [1010, 780],
    [560, 760]
  ],
  "scaleInfo": {
    "pixelsPerMeterLocal": 83.2
  },
  "warnings": []
}
```

### 12.2 Recompute proposal
`POST /api/visual-led/recompute-proposal`

Используется, если пользователь:
- двинул anchor area;
- сменил размер экрана;
- хочет другой вариант.

### 12.3 Save project state
`POST /api/visual-led/save`

Сохраняет:
- background image
- reference scale
- proposed quadrilateral
- final quadrilateral
- homography params
- screen asset config

---

## 13. Data structures

### 13.1 AnalysisResult
- `confidence`
- `dominant_lines`
- `vanishing_points`
- `guide_grid`
- `suggested_quadrilateral`
- `scale_info`
- `warnings`

### 13.2 ScaleInfo
- `point_a`
- `point_b`
- `distance_meters`
- `pixels_length`
- `pixels_per_meter_local`

### 13.3 PlacementState
- `mode`
- `assist_enabled`
- `analysis_result`
- `final_quad`
- `screen_width_m`
- `screen_height_m`
- `homography_matrix`

---

## 14. Confidence model

Система обязана явно показывать уверенность.

### Уровни
- `high`
- `medium`
- `low`

### Что делать при low confidence
- не навязывать автоматический quadrilateral;
- показать только guide lines;
- предложить перейти в manual mode.

---

## 15. Визуальный UI модуля assist

### Overlay elements
- line segments;
- dominant guide lines;
- optional horizon / convergence hints;
- target quadrilateral;
- reference scale segment.

### Controls
- Analyze photo
- Re-run analysis
- Show/hide guides
- Set scale
- Reset scale
- Accept proposal
- Manual adjust
- Reset quadrilateral
- Toggle assist

### States
- idle
- analyzing
- assist ready
- low confidence
- manual editing

---

## 16. Fallback logic

Если алгоритм:
- не нашёл достаточных линий;
- не нашёл устойчивые точки схода;
- нашёл конфликтующие направления;
- получил слишком низкий confidence,

то система должна:
1. вернуть `low confidence`;
2. не генерировать агрессивный автоплейсмент;
3. включить manual placement;
4. сохранить всё равно scale assist.

---

## 17. Какой алгоритм считать оптимальным

### Оптимальный вариант
Не deep learning-first и не “умная магия”, а **hybrid geometric assist**.

### Конкретно
1. пользователь задаёт scale;
2. система детектит линии;
3. система оценивает точки схода;
4. система строит guide overlay;
5. пользователь грубо задаёт область;
6. система предлагает quadrilateral;
7. пользователь корректирует;
8. система делает homography warp.

### Почему это оптимально
- реально работает;
- не переусложняет стек;
- хорошо дебажится;
- предсказуем на индустриальных площадках;
- не превращает задачу в исследовательский R&D-проект.

---

## 18. Что не надо делать сейчас

### Не делать
- monocular depth estimation как основу продукта;
- full scene segmentation как обязательный этап;
- нейросеть, которая угадывает сцену;
- auto-placement без ручного подтверждения;
- выбор точки установки полностью алгоритмом.

### Почему
На ваших типовых фотографиях:
- сложный промышленный фон;
- много шумных конструкций;
- неочевидный ground plane;
- частые снег/грязь/контровый свет;
- неоднозначные вертикали.

---

## 19. Future enhancements

Во второй очереди можно добавить:
- horizon/ground suggestion;
- semantic segmentation пола/зоны установки;
- object occlusion masks;
- автоопределение foreground objects;
- несколько вариантов quadrilateral proposal;
- snap to perspective grid;
- assisted stage fitting;
- shadow suggestion;
- brightness matching.

---

## 20. QA requirements

Нужно тестировать на реальных фото Future Screen.

### Обязательный test set
Собрать минимум:
- 20–30 фотографий реальных площадок;
- разные погодные условия;
- разные ракурсы;
- разные типы фона;
- чистые и шумные сцены;
- промышленные площадки;
- ивент-площадки;
- простые фронтальные кейсы;
- сложные диагональные кейсы.

### Проверять
- устойчивость line detection;
- качество vanishing point estimation;
- качество стартового quadrilateral;
- UX скорости;
- корректность scale assist;
- совпадение preview и export;
- fallback при low confidence.

---

## 21. Метрики качества

### Product metrics
- время до первого приемлемого результата;
- количество ручных правок после assist;
- доля кейсов, где assist был принят;
- доля кейсов, где пользователь ушёл в manual mode;
- субъективная оценка менеджеров.

### Technical metrics
- analysis latency;
- detection success rate;
- average confidence;
- reprojection quality;
- export fidelity.

---

## 22. Acceptance criteria

Фича считается реализованной, если:
1. Пользователь может включить **Perspective Assist**.
2. Пользователь может задать reference scale.
3. Система анализирует фото и возвращает assist model.
4. Система показывает guide lines и candidate directions.
5. Система может предложить стартовый quadrilateral.
6. Пользователь может вручную исправить 4 точки.
7. Система корректно натягивает экран с перспективой.
8. Preview совпадает с export.
9. При low confidence система не ломает сценарий и переводит пользователя в manual mode.
10. На типовых фото Future Screen assist ускоряет placement по сравнению с полностью ручным режимом.

---

## 23. План реализации

### Этап 0 — Prototype spike
Сделать технический прототип отдельно от основного UI:
- line detection;
- vanishing point estimate;
- scale assist;
- quadrilateral proposal;
- homography warp.

### Этап 1 — Backend analysis service
Реализовать:
- preprocessing;
- line detection;
- direction clustering;
- VP estimation;
- confidence model;
- JSON response.

### Этап 2 — Frontend assist UI
Реализовать:
- scale picking;
- assist overlay;
- suggested quadrilateral;
- manual correction.

### Этап 3 — Save/export integration
Реализовать:
- сохранение analysis state;
- сохранение final quad;
- экспорт.

### Этап 4 — Hardening
- tuning thresholds;
- better heuristics;
- UX cleanup;
- low confidence behavior polish.

---

## 24. Рекомендация команде Future Screen

Сначала:
- не лезть в AI;
- не обещать full auto;
- подтвердить полезность geometric assist на реальных фото.

Потом:
- довести assist до стабильного production workflow.

### Ключевой продуктовый тезис
Вам нужен не интеллект, который якобы всё понял. Вам нужен инструмент, который на 30–60% сокращает ручную подгонку и не ломается на сложных площадках.

---

## 25. Итоговое решение

### Рекомендованное решение для первой production-версии
**Semi-automatic geometric perspective assist**:
- user-defined scale calibration;
- line detection;
- vanishing point estimation;
- perspective guide overlay;
- quadrilateral proposal from rough area;
- mandatory manual correction;
- homography-based warp.

### Это лучший баланс между:
- качеством;
- стабильностью;
- UX;
- сроками реализации;
- реальной полезностью для продаж.

---

## 26. Финальная рекомендация

Если команда попытается сразу сделать:
- auto placement,
- AI scene understanding,
- magic perspective inference,

то вы почти наверняка уйдёте в R&D и потеряете время.

Если же вы сделаете:
- ручной режим как базу,
- semi-auto assist как ускоритель,
- geometry-first pipeline,

то получите реальный рабочий инструмент, который можно быстро внедрить в Future Screen.
