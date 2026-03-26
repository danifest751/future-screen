import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import Calculator from '../components/calculator/Calculator';

const CalculatorPage = () => (
  <div className="space-y-2 pb-16">
    <Helmet>
      <title>Калькулятор LED-экрана | Фьючер Скрин</title>
      <meta name="description" content="Онлайн-калькулятор LED-экрана: подберите размер, шаг пикселя и стоимость аренды за 2 минуты." />
    </Helmet>
    <Section
      title="Калькулятор LED-экрана"
      subtitle="Подберём экран под ваше мероприятие за 2 минуты"
    >
      <Calculator />
    </Section>
  </div>
);

export default CalculatorPage;
