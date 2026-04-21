-- Seed home.works, home.event_types, home.process, home.cta into site_content.
-- Mirrors the bundled src/content/pages/home.ts so inline edits have a DB row to upsert into.

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'home_works',
  'home_works',
  $ru${"badge":"Наши работы","title":"Мероприятия,","accentTitle":"которые мы делали","allCasesLink":"Все кейсы →","prevLabel":"Назад","nextLabel":"Вперёд","items":[{"src":"/images/work-corporate-gala.png","tag":"Корпоратив","title":"Гала-ужин производственной компании"},{"src":"/images/work-festival.png","tag":"Open-air фестиваль","title":"Летний музыкальный фестиваль"},{"src":"/images/work-conference.png","tag":"Конференция","title":"Деловой форум 2000 участников"},{"src":"/images/work-concert.png","tag":"Концерт","title":"Rock-шоу с LED-стеной 200 м²"},{"src":"/images/work-wedding.png","tag":"Свадьба","title":"Торжественная церемония в банкетном зале"},{"src":"/images/work-product-launch.png","tag":"Презентация","title":"Запуск флагманского продукта"},{"src":"/images/work-exhibition.png","tag":"Выставка","title":"Стенд на международном форуме"},{"src":"/images/work-newyear.png","tag":"Новый год","title":"Корпоративный новогодний праздник"},{"src":"/images/work-awards.png","tag":"Награждение","title":"Церемония вручения премий"},{"src":"/images/work-sports.png","tag":"Спорт","title":"Финальный матч чемпионата"}]}$ru$,
  $en${"badge":"Our work","title":"Events","accentTitle":"we produced","allCasesLink":"All cases →","prevLabel":"Previous","nextLabel":"Next","items":[{"src":"/images/work-corporate-gala.png","tag":"Corporate","title":"Production company gala dinner"},{"src":"/images/work-festival.png","tag":"Open-air festival","title":"Summer music festival"},{"src":"/images/work-conference.png","tag":"Conference","title":"Business forum for 2000 attendees"},{"src":"/images/work-concert.png","tag":"Concert","title":"Rock show with 200 m² LED wall"},{"src":"/images/work-wedding.png","tag":"Wedding","title":"Ceremony in a premium banquet hall"},{"src":"/images/work-product-launch.png","tag":"Launch","title":"Flagship product launch event"},{"src":"/images/work-exhibition.png","tag":"Exhibition","title":"Booth at an international forum"},{"src":"/images/work-newyear.png","tag":"New Year","title":"Corporate New Year celebration"},{"src":"/images/work-awards.png","tag":"Awards","title":"Award ceremony production"},{"src":"/images/work-sports.png","tag":"Sports","title":"Championship final production"}]}$en$,
  true
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'home_event_types',
  'home_event_types',
  $ru${"badge":"Наши направления","title":"Направления","accentTitle":"мероприятий","prevLabel":"Назад","nextLabel":"Вперёд","items":[{"iconKey":"corporate","title":"Корпоративы","desc":"Техническое оснащение корпоративных праздников и тимбилдингов","photo":"/images/gala-event.png"},{"iconKey":"concert","title":"Концерты","desc":"Полный технический райдер для концертных площадок и фестивалей","photo":"/images/hero-concert.png"},{"iconKey":"conference","title":"Конференции","desc":"Системы синхронного перевода, проекторы, микрофоны","photo":"/images/event-conference.png"},{"iconKey":"wedding","title":"Свадьбы","desc":"LED-экраны для банкетных залов, свет, звук","photo":"/images/event-wedding.png"},{"iconKey":"exhibition","title":"Выставки","desc":"Светодиодные экраны для стендов, интерактивные панели","photo":"/images/event-exhibition.png"},{"iconKey":"presentation","title":"Презентации","desc":"Премиум-решения для продуктовых презентаций","photo":"/images/event-presentation.png"},{"iconKey":"festival","title":"Фестивали","desc":"Open-air площадки: сцена, звук, LED-экраны для тысяч зрителей","photo":"/images/festival-crowd.png"},{"iconKey":"promo","title":"Промо-акции","desc":"Рекламные стойки, LED-конструкции, брендированные экраны","photo":"/images/hero-led-event.png"},{"iconKey":"theater","title":"Театр и шоу","desc":"Сценический свет, звуковые системы, LED-задники для спектаклей","photo":"/images/event-theater.png"},{"iconKey":"sports","title":"Спортивные события","desc":"Видеотабло, трансляции, PA-системы для арен и стадионов","photo":"/images/event-sports.png"}]}$ru$,
  $en${"badge":"Our directions","title":"Event","accentTitle":"types","prevLabel":"Previous","nextLabel":"Next","items":[{"iconKey":"corporate","title":"Corporate events","desc":"Technical setup for corporate events and team activities","photo":"/images/gala-event.png"},{"iconKey":"concert","title":"Concerts","desc":"Full technical rider support for concert venues and festivals","photo":"/images/hero-concert.png"},{"iconKey":"conference","title":"Conferences","desc":"Interpretation systems, projectors, and microphones","photo":"/images/event-conference.png"},{"iconKey":"wedding","title":"Weddings","desc":"LED screens, lighting, and sound for banquet venues","photo":"/images/event-wedding.png"},{"iconKey":"exhibition","title":"Exhibitions","desc":"LED solutions and interactive panels for booths","photo":"/images/event-exhibition.png"},{"iconKey":"presentation","title":"Presentations","desc":"Premium setup for product presentations","photo":"/images/event-presentation.png"},{"iconKey":"festival","title":"Festivals","desc":"Open-air stages, sound, and LED for large audiences","photo":"/images/festival-crowd.png"},{"iconKey":"promo","title":"Promo campaigns","desc":"Branded LED constructions and promo setups","photo":"/images/hero-led-event.png"},{"iconKey":"theater","title":"Theatre and show","desc":"Stage lighting, sound, and LED backdrops","photo":"/images/event-theater.png"},{"iconKey":"sports","title":"Sports events","desc":"Scoreboards, broadcast support, and PA systems","photo":"/images/event-sports.png"}]}$en$,
  true
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'home_process',
  'home_process',
  $ru${"badge":"Процесс работы","title":"Как мы","accentTitle":"работаем","steps":[{"num":"01","title":"Заявка","desc":"Опишите ваше мероприятие — дату, количество гостей, площадку и задачи"},{"num":"02","title":"Расчёт","desc":"Подбираем оптимальное оборудование и составляем коммерческое предложение"},{"num":"03","title":"Монтаж","desc":"Доставка, установка и настройка всего оборудования заранее до мероприятия"},{"num":"04","title":"Поддержка","desc":"Техническое сопровождение во время события и демонтаж после"}]}$ru$,
  $en${"badge":"Workflow","title":"How we","accentTitle":"work","steps":[{"num":"01","title":"Request","desc":"Tell us your event date, guest count, venue, and goals"},{"num":"02","title":"Estimate","desc":"We choose optimal equipment and prepare a commercial proposal"},{"num":"03","title":"Setup","desc":"Delivery, installation, and full system preparation before the event"},{"num":"04","title":"Support","desc":"On-site technical support during the event and teardown after"}]}$en$,
  true
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'home_cta',
  'home_cta',
  $ru${"title":"Готовы обсудить","accentTitle":"ваше мероприятие?","subtitle":"Расскажите о вашем проекте — мы рассчитаем стоимость и предложим лучшее техническое решение"}$ru$,
  $en${"title":"Ready to discuss","accentTitle":"your event?","subtitle":"Share your project details and we will estimate costs and offer the best technical setup"}$en$,
  true
)
ON CONFLICT (key) DO NOTHING;

