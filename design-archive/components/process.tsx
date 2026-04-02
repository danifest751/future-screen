const steps = [
  {
    num: "01",
    title: "Заявка",
    desc: "Опишите ваше мероприятие — дату, количество гостей, площадку и задачи",
  },
  {
    num: "02",
    title: "Расчёт",
    desc: "Подбираем оптимальное оборудование и составляем коммерческое предложение",
  },
  {
    num: "03",
    title: "Монтаж",
    desc: "Доставка, установка и настройка всего оборудования заранее до мероприятия",
  },
  {
    num: "04",
    title: "Поддержка",
    desc: "Техническое сопровождение во время события и демонтаж после его завершения",
  },
]

export function Process() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-14">
          <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">
            Процесс работы
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance">
            Как мы работаем
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map(({ num, title, desc }, index) => (
            <div key={num} className="relative flex flex-col gap-4">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-5 left-[calc(100%+1rem)] w-[calc(100%-2rem)] h-px bg-border" />
              )}

              {/* Number badge */}
              <div className="w-10 h-10 rounded-sm border border-primary/40 bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-xs font-bold tabular-nums">{num}</span>
              </div>

              <div>
                <h3 className="text-foreground font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
