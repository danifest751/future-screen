import { lazy, Suspense, useMemo } from 'react';
import { useRoutes } from 'react-router-dom';
import Layout from './components/Layout';
import { useCategories } from './hooks/useCategories';
import { Helmet } from 'react-helmet-async';
import ProtectedRoute from './components/ProtectedRoute';
import { StructuredData } from './components/StructuredData';

const HomePage = lazy(() => import('./pages/HomePage'));
const LedPage = lazy(() => import('./pages/LedPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const RentPage = lazy(() => import('./pages/RentPage'));
const RentCategoryPage = lazy(() => import('./pages/RentCategoryPage'));
const CasesPage = lazy(() => import('./pages/CasesPage'));
const CaseDetailsPage = lazy(() => import('./pages/CaseDetailsPage'));
const PricesPage = lazy(() => import('./pages/PricesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactsPage = lazy(() => import('./pages/ContactsPage'));
const ConsultPage = lazy(() => import('./pages/ConsultPage'));
const CalculatorPage = lazy(() => import('./pages/CalculatorPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminContentPage = lazy(() => import('./pages/admin/AdminContentPage'));

const PageLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
  </div>
);

const App = () => {
  const { categories } = useCategories();
  const routes = useMemo(
    () => [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/led',
        element: <LedPage />,
      },
      {
        path: '/support',
        element: <SupportPage />,
      },
      {
        path: '/rent',
        element: <RentPage />,
      },
      ...categories.map((c) => ({
        path: c.pagePath,
        element: <RentCategoryPage categoryId={c.id} />,
      })),
      {
        path: '/cases',
        element: <CasesPage />,
      },
      {
        path: '/cases/:slug',
        element: <CaseDetailsPage />,
      },
      {
        path: '/prices',
        element: <PricesPage />,
      },
      {
        path: '/about',
        element: <AboutPage />,
      },
      {
        path: '/contacts',
        element: <ContactsPage />,
      },
      {
        path: '/consult',
        element: <ConsultPage />,
      },
      {
        path: '/calculator',
        element: <CalculatorPage />,
      },
      {
        path: '/admin/content',
        element: <ProtectedRoute><AdminContentPage /></ProtectedRoute>,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
    [categories]
  );

  const element = useRoutes(routes);

  return (
    <Layout>
      <Helmet>
        <title>Future Screen — LED, звук, свет, сцены</title>
        <meta
          name="description"
          content="Техсопровождение мероприятий: LED-экраны, звук, свет, сцены. КП за 15 минут. Работаем по РФ с 2007 года."
        />
      </Helmet>
      <StructuredData />
      <Suspense fallback={<PageLoader />}>
        {element}
      </Suspense>
    </Layout>
  );
};

export default App;
