import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChevronDown } from "lucide-react"

const stats = [
  { value: "18+", label: "лет опыта" },
  { value: "500+", label: "мероприятий/год" },
  { value: "300+", label: "единиц техники" },
  { value: "24/7", label: "поддержка" },
]

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="LED экраны на концерте"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-background/70" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Grid lines overlay */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 pt-24 pb-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 rounded-full px-4 py-1.5 text-primary text-xs font-medium tracking-widest uppercase mb-8 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Работаем по всей России с 2007 года
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[1.05] tracking-tight text-balance max-w-4xl mb-6">
          Техническое
          <br />
          <span className="text-primary">оснащение</span>
          <br />
          мероприятий
        </h1>

        {/* Subheading */}
        <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-xl mb-10">
          LED-экраны, свет, звук, сцены и комплекты под ключ для выставок,
          концертов, конференций и корпоративов.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-start gap-4 mb-20">
          <Link
            href="#contact"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 text-sm font-semibold rounded-sm hover:bg-primary/90 transition-colors"
          >
            Рассчитать мероприятие
            <ArrowRight size={16} />
          </Link>
          <Link
            href="#cases"
            className="flex items-center gap-2 border border-border text-foreground px-7 py-3.5 text-sm font-semibold rounded-sm hover:border-primary/50 hover:text-primary transition-colors"
          >
            Смотреть кейсы
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 border-t border-border pt-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
                {value}
              </span>
              <span className="text-muted-foreground text-sm leading-relaxed">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-muted-foreground animate-bounce">
        <ChevronDown size={20} />
      </div>
    </section>
  )
}
