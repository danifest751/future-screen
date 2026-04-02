import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-card rounded-sm" />
              </div>
              <span className="text-foreground font-semibold text-sm uppercase tracking-tight">
                Future Screen
              </span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-[200px]">
              Техническое оснащение мероприятий по всей России с 2007 года.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-3">
            <p className="text-foreground text-xs font-semibold uppercase tracking-widest mb-1">
              Навигация
            </p>
            {["Оборудование", "Направления", "О компании", "Кейсы"].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Services */}
          <div className="flex flex-col gap-3">
            <p className="text-foreground text-xs font-semibold uppercase tracking-widest mb-1">
              Оборудование
            </p>
            {["LED-экраны", "Звук", "Свет", "Сцены", "Плазменные панели"].map((item) => (
              <span key={item} className="text-muted-foreground text-sm">
                {item}
              </span>
            ))}
          </div>

          {/* Contacts */}
          <div className="flex flex-col gap-3">
            <p className="text-foreground text-xs font-semibold uppercase tracking-widest mb-1">
              Контакты
            </p>
            <span className="text-muted-foreground text-sm">+7 (343) 000-00-00</span>
            <span className="text-muted-foreground text-sm">info@future-screen.ru</span>
            <span className="text-muted-foreground text-sm">Екатеринбург</span>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
          <p className="text-muted-foreground text-xs">
            © 2025 Future Screen. Все права защищены.
          </p>
          <p className="text-muted-foreground text-xs">
            Политика конфиденциальности
          </p>
        </div>
      </div>
    </footer>
  )
}
