import { ArrowRight, Calculator, CheckCircle, ChevronRight, MonitorPlay, Music, Presentation, Settings, Speaker, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Contrast() {
  return (
    <div className="min-h-screen bg-[#111111] text-zinc-300 font-sans selection:bg-amber-500/30">
      {/* Hero Split Screen */}
      <section className="relative flex flex-col lg:flex-row min-h-[90vh] lg:min-h-screen">
        {/* Left: Photo (60%) */}
        <div className="relative w-full lg:w-[60%] h-[50vh] lg:h-full shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent lg:bg-gradient-to-r z-10" />
          <img
            src="/__mockup/images/stage-setup.png"
            alt="Stage setup"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Right: Content (40%) */}
        <div className="relative w-full lg:w-[40%] flex flex-col justify-center px-8 py-16 lg:px-16 z-20 bg-[#111111] lg:bg-transparent -mt-20 lg:mt-0">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <MonitorPlay className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white uppercase">Фьючер Скрин</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            Профессиональное <br />
            <span className="text-amber-500">техническое</span> <br />
            обеспечение.
          </h1>

          <p className="text-lg text-zinc-400 mb-10 leading-relaxed max-w-md">
            Аренда LED-экранов, звука, света и сцены для мероприятий любого масштаба. Точность, надежность, B2B-подход.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold h-12 px-8 rounded-none">
              Рассчитать проект
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800 hover:text-white h-12 px-8 rounded-none bg-transparent">
              Оставить заявку
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-zinc-800">
            <div>
              <div className="text-3xl font-bold text-white mb-1">17<span className="text-amber-500">лет</span></div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Опыта</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">1000<span className="text-amber-500">+</span></div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Проектов</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">300<span className="text-amber-500">+</span></div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Единиц техники</div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipment Catalog (2x2 Grid) */}
      <section className="py-24 bg-[#111111]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Каталог оборудования</h2>
            <p className="text-zinc-400 max-w-xl">Наш парк техники регулярно обновляется и проходит техническое обслуживание перед каждым выездом.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-px bg-zinc-800 border border-zinc-800">
            {/* Item 1 */}
            <div className="flex flex-col sm:flex-row bg-[#151515] group">
              <div className="w-full sm:w-1/2 h-64 sm:h-auto relative overflow-hidden">
                <img src="/__mockup/images/led-closeup.png" alt="LED Screens" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80" />
              </div>
              <div className="w-full sm:w-1/2 p-8 lg:p-10 flex flex-col justify-center">
                <MonitorPlay className="w-8 h-8 text-amber-500 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">LED Экраны</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Модульные светодиодные экраны высокого разрешения для помещений и улицы. Шаг пикселя от 1.9 до 4.8 мм.
                </p>
                <a href="#" className="inline-flex items-center text-amber-500 font-semibold text-sm hover:text-amber-400 transition-colors mt-auto">
                  Смотреть характеристики <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex flex-col sm:flex-row-reverse bg-[#151515] group">
              <div className="w-full sm:w-1/2 h-64 sm:h-auto relative overflow-hidden">
                <img src="/__mockup/images/hero-concert.png" alt="Sound" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80" />
              </div>
              <div className="w-full sm:w-1/2 p-8 lg:p-10 flex flex-col justify-center">
                <Speaker className="w-8 h-8 text-amber-500 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">Звуковое оборудование</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Линейные массивы, сценические мониторы, цифровые микшерные пульты и радиосистемы топовых брендов.
                </p>
                <a href="#" className="inline-flex items-center text-amber-500 font-semibold text-sm hover:text-amber-400 transition-colors mt-auto">
                  Смотреть характеристики <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex flex-col sm:flex-row bg-[#151515] group">
              <div className="w-full sm:w-1/2 h-64 sm:h-auto relative overflow-hidden">
                <img src="/__mockup/images/festival-crowd.png" alt="Light" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80" />
              </div>
              <div className="w-full sm:w-1/2 p-8 lg:p-10 flex flex-col justify-center">
                <Settings className="w-8 h-8 text-amber-500 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">Световые приборы</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Динамические головы (Wash, Spot, Beam), архитектурная подсветка, лазерные системы и генераторы спецэффектов.
                </p>
                <a href="#" className="inline-flex items-center text-amber-500 font-semibold text-sm hover:text-amber-400 transition-colors mt-auto">
                  Смотреть характеристики <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex flex-col sm:flex-row-reverse bg-[#151515] group">
              <div className="w-full sm:w-1/2 h-64 sm:h-auto relative overflow-hidden">
                <img src="/__mockup/images/event-conference.png" alt="Stage" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80" />
              </div>
              <div className="w-full sm:w-1/2 p-8 lg:p-10 flex flex-col justify-center">
                <Presentation className="w-8 h-8 text-amber-500 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">Сценические конструкции</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Сценические подиумы, фермовые конструкции, граунд-саппорты, лебедки и элеваторы с сертификатами безопасности.
                </p>
                <a href="#" className="inline-flex items-center text-amber-500 font-semibold text-sm hover:text-amber-400 transition-colors mt-auto">
                  Смотреть характеристики <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Type Tape */}
      <section className="py-16 bg-[#0a0a0a] border-y border-zinc-800 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-white">Форматы мероприятий</h2>
          </div>
          <div className="text-zinc-500 text-sm uppercase tracking-wider font-semibold">Комплексные решения</div>
        </div>
        
        <div className="w-full flex gap-4 px-6 overflow-x-auto pb-8 snap-x scrollbar-hide">
          {[
            { title: "Корпоративы", icon: Users, desc: "Новогодние банкеты, летние выезды" },
            { title: "Концерты", icon: Music, desc: "Живой звук, туровые комплекты" },
            { title: "Конференции", icon: Presentation, desc: "Деловые форумы, трансляции" },
            { title: "Выставки", icon: MonitorPlay, desc: "Интерактивные стенды, плазмы" },
            { title: "Промо-акции", icon: Speaker, desc: "Открытия, презентации брендов" },
          ].map((item, i) => (
            <div key={i} className="min-w-[280px] shrink-0 bg-[#151515] border border-zinc-800 p-6 snap-start hover:border-amber-500/50 transition-colors group cursor-pointer">
              <div className="w-12 h-12 bg-amber-500/10 flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors">
                <item.icon className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-zinc-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Calculator / Contact Form (Light mode contrast) */}
      <section className="py-24 bg-white text-zinc-900">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-6">
                <Calculator className="w-4 h-4" />
                Расчет сметы
              </div>
              <h2 className="text-3xl lg:text-5xl font-extrabold mb-6 tracking-tight">
                Получите точный расчет для вашего проекта
              </h2>
              <p className="text-lg text-zinc-600 mb-8 max-w-md">
                Заполните форму, и наши технические специалисты свяжутся с вами в течение 30 минут с предварительной сметой.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Персональный менеджер-техник",
                  "Оптимизация бюджета без потери качества",
                  "3D-визуализация сцены (при необходимости)",
                  "Выезд на площадку для замеров бесплатно"
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-zinc-700 font-medium">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 p-8 lg:p-12 shadow-xl shadow-zinc-200/50">
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Имя</label>
                    <input 
                      type="text" 
                      className="w-full bg-white border border-zinc-300 h-12 px-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all rounded-none"
                      placeholder="Иван Иванов"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Телефон</label>
                    <input 
                      type="tel" 
                      className="w-full bg-white border border-zinc-300 h-12 px-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all rounded-none"
                      placeholder="+7 (___) ___-__-__"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Тип мероприятия</label>
                  <select className="w-full bg-white border border-zinc-300 h-12 px-4 text-zinc-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all rounded-none appearance-none cursor-pointer">
                    <option value="" disabled selected>Выберите тип</option>
                    <option>Корпоратив</option>
                    <option>Концерт</option>
                    <option>Конференция</option>
                    <option>Выставка</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Оборудование (что нужно)</label>
                  <textarea 
                    className="w-full bg-white border border-zinc-300 p-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all rounded-none min-h-[120px] resize-none"
                    placeholder="Опишите задачу (например: нужен LED экран 4х3 метра и звук на 200 человек)"
                  ></textarea>
                </div>

                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-14 text-lg rounded-none mt-4">
                  Отправить запрос
                </Button>
                <p className="text-xs text-center text-zinc-500 mt-4">
                  Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="bg-[#111111] py-12 border-t border-zinc-800 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <MonitorPlay className="w-5 h-5 text-amber-500" />
          <span className="text-lg font-bold text-white tracking-widest uppercase">Фьючер Скрин</span>
        </div>
        <p className="text-zinc-500 text-sm">© {new Date().getFullYear()} Все права защищены. Аренда LED-экранов, звука, света и сцены.</p>
        <p className="text-zinc-600 text-sm mt-2">+7 (495) 668-04-06</p>
      </footer>
    </div>
  );
}
