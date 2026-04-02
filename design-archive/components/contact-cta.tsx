"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"

export function ContactCta() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section id="contact" className="py-24 bg-background relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">
              Связаться с нами
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance mb-6">
              Готовы обсудить
              <br />
              ваше мероприятие?
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-10">
              Расскажите о вашем проекте — мы рассчитаем стоимость и предложим
              лучшее техническое решение.
            </p>

            {/* Contact info */}
            <div className="flex flex-col gap-4">
              {[
                ["Телефон", "+7 (343) 000-00-00"],
                ["Email", "info@future-screen.ru"],
                ["Адрес", "Екатеринбург, ул. Техническая 1"],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4">
                  <span className="text-muted-foreground text-sm w-20 shrink-0">{label}</span>
                  <span className="text-foreground text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-card border border-border rounded-sm p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowRight size={20} className="text-primary" />
                </div>
                <p className="text-foreground font-semibold text-lg">Заявка отправлена!</p>
                <p className="text-muted-foreground text-sm">
                  Мы свяжемся с вами в ближайшее время.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Имя
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иван Петров"
                    required
                    className="bg-background border border-border text-foreground text-sm rounded-sm px-4 py-3 placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (___) ___-__-__"
                    required
                    className="bg-background border border-border text-foreground text-sm rounded-sm px-4 py-3 placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-muted-foreground text-xs uppercase tracking-wider">
                    О мероприятии
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Опишите формат, дату и количество гостей..."
                    rows={4}
                    className="bg-background border border-border text-foreground text-sm rounded-sm px-4 py-3 placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 text-sm font-semibold rounded-sm hover:bg-primary/90 transition-colors"
                >
                  Отправить заявку
                  <ArrowRight size={16} />
                </button>
                <p className="text-muted-foreground text-xs text-center leading-relaxed">
                  Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
