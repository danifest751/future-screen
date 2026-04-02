import { Music2, Mic2, Users, Heart, LayoutGrid, Presentation } from "lucide-react"

const directions = [
  {
    icon: Music2,
    title: "Концерты",
    desc: "Полный технический райдер для концертных площадок и фестивалей любого масштаба.",
    num: "01",
  },
  {
    icon: Mic2,
    title: "Конференции",
    desc: "Системы синхронного перевода, проекторы, микрофоны, LED-экраны для залов.",
    num: "02",
  },
  {
    icon: Users,
    title: "Корпоративы",
    desc: "Техническое оснащение корпоративных праздников, тимбилдингов и банкетов.",
    num: "03",
  },
  {
    icon: Heart,
    title: "Свадьбы",
    desc: "LED-экраны для банкетных залов, сценическое освещение, звуковой комплект.",
    num: "04",
  },
  {
    icon: LayoutGrid,
    title: "Выставки",
    desc: "Светодиодные экраны для стендов, интерактивные панели, презентационное оборудование.",
    num: "05",
  },
  {
    icon: Presentation,
    title: "Презентации",
    desc: "Премиум-решения для продуктовых запусков, пресс-конференций и бизнес-мероприятий.",
    num: "06",
  },
]

export function Directions() {
  return (
    <section id="directions" className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-14">
          <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">
            Наши направления
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance">
            Любой формат мероприятия
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {directions.map(({ icon: Icon, title, desc, num }) => (
            <article
              key={title}
              className="group bg-background p-8 hover:bg-card transition-colors duration-200 cursor-default"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center">
                  <Icon size={20} className="text-primary" />
                </div>
                <span className="text-muted-foreground/30 text-3xl font-bold tabular-nums">
                  {num}
                </span>
              </div>
              <h3 className="text-foreground font-semibold text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
