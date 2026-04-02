import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function Reportage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#764ba2] selection:text-white">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Inter:wght@400;500;600&display=swap');
        h1, h2, h3, h4, h5, h6 { font-family: 'Space Grotesk', sans-serif; }
        body { font-family: 'Inter', sans-serif; }
      `}} />

      {/* Hero Section */}
      <section 
        className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url('/__mockup/images/hero-led-event.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="absolute inset-0 bg-black/60 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-0"></div>
        
        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <div className="inline-block mb-4 px-3 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-sm font-medium tracking-wide">
            Опыт с 2007 года • 17+ лет
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight drop-shadow-lg">
            Аренда LED-экранов,<br/>звука, света и сцены
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-medium">
            Техническое обеспечение корпоративов, концертов, конференций и выставок любого масштаба.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90 text-white border-0 text-base h-14 px-8 rounded-full shadow-lg shadow-indigo-500/25 transition-all hover:scale-105">
              Рассчитать мероприятие
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white hover:text-black h-14 px-8 rounded-full text-base transition-all bg-transparent">
              Позвонить +7 (495) 668-04-06
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-b border-white/5 relative z-10 bg-[#0a0a0a]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="p-4">
              <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2] mb-2">300+</div>
              <div className="text-gray-400 font-medium">Единиц техники</div>
            </div>
            <div className="p-4">
              <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2] mb-2">50+</div>
              <div className="text-gray-400 font-medium">Партнёров</div>
            </div>
            <div className="p-4">
              <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2] mb-2">1000+</div>
              <div className="text-gray-400 font-medium">Мероприятий</div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Work Section */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Наши работы</h2>
              <p className="text-gray-400 text-lg max-w-xl">
                Мы создаем незабываемые впечатления. Посмотрите, как выглядит наше оборудование в деле.
              </p>
            </div>
            <Button variant="link" className="text-[#667eea] hover:text-[#764ba2] hidden md:flex items-center gap-2">
              Смотреть все проекты &rarr;
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer">
              <img src="/__mockup/images/hero-concert.png" alt="Концерт" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-100"></div>
              <div className="absolute bottom-0 left-0 p-8 transform translate-y-4 transition-transform group-hover:translate-y-0">
                <p className="text-[#667eea] font-medium mb-2 uppercase tracking-wider text-sm">Концертная сцена</p>
                <h3 className="text-2xl font-bold text-white">Фестиваль музыки</h3>
              </div>
            </div>
            <div className="group relative rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer">
              <img src="/__mockup/images/gala-event.png" alt="Гала-ужин" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-100"></div>
              <div className="absolute bottom-0 left-0 p-8 transform translate-y-4 transition-transform group-hover:translate-y-0">
                <p className="text-[#667eea] font-medium mb-2 uppercase tracking-wider text-sm">Корпоратив</p>
                <h3 className="text-2xl font-bold text-white">Ежегодный Гала-ужин</h3>
              </div>
            </div>
            <div className="group relative rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer">
              <img src="/__mockup/images/festival-crowd.png" alt="Фестиваль" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-100"></div>
              <div className="absolute bottom-0 left-0 p-8 transform translate-y-4 transition-transform group-hover:translate-y-0">
                <p className="text-[#667eea] font-medium mb-2 uppercase tracking-wider text-sm">Масштабное событие</p>
                <h3 className="text-2xl font-bold text-white">Open-air Фестиваль</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipment Section */}
      <section className="py-24 bg-[#111111]">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">Оборудование</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 relative rounded-2xl overflow-hidden min-h-[300px] flex items-end group p-8">
              <div className="absolute inset-0 z-0">
                <img src="/__mockup/images/led-closeup.png" alt="LED экраны" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors"></div>
              </div>
              <div className="relative z-10 w-full">
                <h3 className="text-3xl font-bold mb-3">LED-экраны</h3>
                <p className="text-gray-300 mb-6 max-w-md">Высокое разрешение, любая конфигурация. От небольших панелей до гигантских видеостен.</p>
                <Button variant="outline" className="border-white/30 bg-black/20 backdrop-blur-sm text-white hover:bg-white hover:text-black rounded-full">
                  В каталог
                </Button>
              </div>
            </div>
            
            <div className="rounded-2xl overflow-hidden min-h-[300px] flex items-end p-8 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#667eea] opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity"></div>
              <div className="relative z-10 w-full">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#667eea]"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">Звук</h3>
                <p className="text-gray-400 text-sm mb-6">Линейные массивы, мониторы, микрофоны</p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden min-h-[300px] flex items-end p-8 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#764ba2] opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity"></div>
              <div className="relative z-10 w-full">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#764ba2]"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">Свет</h3>
                <p className="text-gray-400 text-sm mb-6">Головы, прожекторы, стробоскопы, лазеры</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Form Section */}
      <section className="py-24 bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto bg-[#111111] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Оставьте заявку на расчет</h2>
              <p className="text-gray-400">Свяжемся с вами в течение 15 минут, уточним детали и подготовим смету.</p>
            </div>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Имя</label>
                  <Input placeholder="Ваше имя" className="bg-[#0a0a0a] border-white/10 text-white h-12 rounded-xl focus-visible:ring-[#667eea]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Телефон</label>
                  <Input placeholder="+7 (___) ___-__-__" className="bg-[#0a0a0a] border-white/10 text-white h-12 rounded-xl focus-visible:ring-[#667eea]" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Детали мероприятия</label>
                <Textarea placeholder="Дата, площадка, формат..." className="bg-[#0a0a0a] border-white/10 text-white min-h-[120px] rounded-xl focus-visible:ring-[#667eea] resize-none" />
              </div>
              <Button className="w-full h-14 text-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 mt-4">
                Отправить заявку
              </Button>
              <p className="text-xs text-center text-gray-500 mt-4">
                Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 border-t border-white/10 text-sm">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-bold font-['Space_Grotesk'] tracking-tighter">ФЬЮЧЕР<span className="text-[#667eea]">СКРИН</span></div>
          <div className="text-gray-400">© 2007–2024. Все права защищены.</div>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Telegram</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">WhatsApp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
