import React from 'react';
import { ArrowRight, Phone } from 'lucide-react';

export function Mosaic() {
  const images = [
    '/__mockup/images/hero-led-event.png',
    '/__mockup/images/hero-concert.png',
    '/__mockup/images/gala-event.png',
    '/__mockup/images/festival-crowd.png',
    '/__mockup/images/stage-setup.png',
    '/__mockup/images/event-conference.png'
  ];

  const equipment = [
    { title: 'LED-экраны', img: '/__mockup/images/led-closeup.png' },
    { title: 'Звуковое оборудование', img: '/__mockup/images/hero-concert.png' },
    { title: 'Сценический свет', img: '/__mockup/images/stage-setup.png' },
    { title: 'Сцены и фермы', img: '/__mockup/images/event-conference.png' },
    { title: 'Плазменные панели', img: '/__mockup/images/gala-event.png' },
  ];

  return (
    <div className="bg-[#080808] text-white min-h-screen font-sans selection:bg-red-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* CSS Grid 3x2 */}
        <div className="grid grid-cols-3 grid-rows-2 w-full h-full gap-0">
          {images.map((src, i) => (
            <div key={i} className="relative w-full h-full overflow-hidden group">
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-700 z-10" />
              <img 
                src={src} 
                alt={`Hero image ${i + 1}`} 
                className="w-full h-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-[2s] ease-out"
              />
            </div>
          ))}
        </div>

        {/* Center overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md p-12 md:p-16 border border-white/10 flex flex-col items-center text-center max-w-3xl pointer-events-auto">
            <h1 
              className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-white mb-4 uppercase"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Фьючер Скрин
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-light tracking-wide mb-8">
              Аренда LED-экранов, звука, света и сцены
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <button className="bg-[#ef4444] hover:bg-red-600 text-white px-8 py-4 text-sm uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2">
                Рассчитать мероприятие <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Description Strip */}
      <section className="w-full bg-[#111] border-y border-white/5 py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <p className="text-lg md:text-xl text-white/80 font-light flex-1 max-w-2xl">
            С 2007 года мы технически обеспечиваем корпоративы, концерты, конференции, выставки и промо-акции любого масштаба.
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-center">
            <div>
              <div className="text-4xl font-bold text-[#ef4444]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>17+</div>
              <div className="text-xs uppercase tracking-widest text-white/50 mt-1">лет опыта</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#ef4444]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>1000+</div>
              <div className="text-xs uppercase tracking-widest text-white/50 mt-1">мероприятий</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#ef4444]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>300+</div>
              <div className="text-xs uppercase tracking-widest text-white/50 mt-1">единиц техники</div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipment Carousel */}
      <section className="py-24 px-6 md:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
          <h2 className="text-5xl md:text-7xl font-bold uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Наше оборудование
          </h2>
          <div className="hidden md:flex gap-2 text-white/50 items-center text-sm tracking-widest uppercase">
            Листайте <ArrowRight className="w-4 h-4" />
          </div>
        </div>
        
        {/* Horizontal scroll container */}
        <div className="flex overflow-x-auto pb-12 gap-6 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {equipment.map((item, i) => (
            <div key={i} className="min-w-[85vw] md:min-w-[400px] h-[500px] relative flex-shrink-0 snap-center group cursor-pointer overflow-hidden bg-[#111]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
              <img 
                src={item.img} 
                alt={item.title} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                <div className="w-12 h-1 bg-[#ef4444] mb-4 transform origin-left group-hover:scale-x-150 transition-transform duration-500" />
                <h3 className="text-3xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#ef4444]/90 mix-blend-multiply z-10" />
          <div className="absolute inset-0 bg-black/60 z-10" />
          <img 
            src="/__mockup/images/festival-crowd.png" 
            alt="Festival crowd" 
            className="w-full h-full object-cover scale-105"
          />
        </div>
        
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
          <h2 className="text-6xl md:text-8xl font-bold uppercase mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Готовы к вашему событию
          </h2>
          <p className="text-xl md:text-2xl text-white/80 font-light mb-10 max-w-2xl mx-auto">
            Свяжитесь с нами для детального расчета вашего мероприятия и подбора оптимального технического решения.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="bg-white text-black hover:bg-gray-200 px-8 py-4 text-sm uppercase tracking-widest font-bold transition-all w-full sm:w-auto">
              Оставить заявку
            </button>
            <a href="tel:+74956680406" className="flex items-center gap-3 text-white hover:text-white/70 transition-colors uppercase tracking-widest text-sm font-bold w-full sm:w-auto justify-center border border-white/20 hover:border-white/50 px-8 py-4">
              <Phone className="w-4 h-4" />
              +7 (495) 668-04-06
            </a>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
    </div>
  );
}
