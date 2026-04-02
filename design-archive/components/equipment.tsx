import Image from "next/image"
import { Monitor, Volume2, Lightbulb, Layers, ArrowUpRight } from "lucide-react"

const items = [
  {
    icon: Monitor,
    title: "LED-экраны",
    desc: "Интерьерные и уличные светодиодные экраны от 2.6мм. Модульная система от 3×2м до 10×6м.",
    img: "/images/equipment-led.jpg",
    tag: "Видео",
  },
  {
    icon: Volume2,
    title: "Звуковое оборудование",
    desc: "Профессиональные комплекты Shure/Sennheiser, активные АС, микшеры для любых форматов.",
    img: "/images/equipment-sound.jpg",
    tag: "Звук",
  },
  {
    icon: Lightbulb,
    title: "Световое оборудование",
    desc: "LED PAR, динамические головы, прожекторы, DMX-контроллеры для сценического освещения.",
    img: "/images/equipment-light.jpg",
    tag: "Свет",
  },
  {
    icon: Layers,
    title: "Сценические конструкции",
    desc: "Модульные сцены, алюминиевые фермы, подиумы и трасты для площадок любой сложности.",
    img: "/images/hero-bg.jpg",
    tag: "Сцена",
  },
]

export function Equipment() {
  return (
    <section id="equipment" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">
              Парк оборудования
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance">
              Оборудование
              <br />
              в аренду
            </h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            Полный спектр профессионального оборудования для мероприятий любого масштаба.
            300+ единиц техники в собственном парке.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(({ icon: Icon, title, desc, img, tag }) => (
            <article
              key={title}
              className="group relative overflow-hidden rounded-sm bg-card border border-border hover:border-primary/40 transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={img}
                  alt={title}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-background/50" />
                {/* Tag */}
                <span className="absolute top-4 left-4 bg-primary/20 border border-primary/30 text-primary text-xs font-medium px-2.5 py-1 rounded-full tracking-wide">
                  {tag}
                </span>
              </div>

              {/* Content */}
              <div className="p-6 flex items-start gap-4">
                <div className="mt-0.5 w-9 h-9 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-foreground font-semibold">{title}</h3>
                    <ArrowUpRight
                      size={16}
                      className="text-muted-foreground group-hover:text-primary transition-colors"
                    />
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
