import Image from "next/image"
import { ArrowUpRight } from "lucide-react"

const cases = [
  {
    title: "Концерт на 5000 чел.",
    category: "Концерт",
    desc: "LED-экраны 8×5м, звуковой комплект line array, сценическое освещение 120 приборов.",
    img: "/images/case-concert.jpg",
    size: "large",
  },
  {
    title: "Форум РИФ-2024",
    category: "Конференция",
    desc: "Три зала, синхронный перевод, 4K-трансляция, интерактивные панели.",
    img: "/images/case-conference.jpg",
    size: "small",
  },
  {
    title: "Корпоратив ТМК",
    category: "Корпоратив",
    desc: "Комплексное оснащение на 800 гостей: свет, звук, LED-фон 6×3м.",
    img: "/images/equipment-light.jpg",
    size: "small",
  },
]

export function Cases() {
  return (
    <section id="cases" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">
              Наши работы
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance">
              Реализованные
              <br />
              проекты
            </h2>
          </div>
          <button className="flex items-center gap-2 text-primary text-sm font-medium hover:gap-3 transition-all self-start md:self-auto">
            Все кейсы <ArrowUpRight size={16} />
          </button>
        </div>

        {/* Cases grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Large case */}
          <article className="group relative overflow-hidden rounded-sm bg-card border border-border hover:border-primary/40 transition-all duration-300 md:row-span-2">
            <div className="relative h-72 md:h-full min-h-72 overflow-hidden">
              <Image
                src={cases[0].img}
                alt={cases[0].title}
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="text-primary text-xs font-semibold tracking-widest uppercase mb-2 block">
                {cases[0].category}
              </span>
              <h3 className="text-foreground text-xl font-bold mb-1">{cases[0].title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{cases[0].desc}</p>
            </div>
          </article>

          {/* Small cases */}
          {cases.slice(1).map((c) => (
            <article
              key={c.title}
              className="group relative overflow-hidden rounded-sm bg-card border border-border hover:border-primary/40 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={c.img}
                  alt={c.title}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
              </div>
              <div className="p-5">
                <span className="text-primary text-xs font-semibold tracking-widest uppercase mb-1.5 block">
                  {c.category}
                </span>
                <h3 className="text-foreground font-bold mb-1">{c.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{c.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
