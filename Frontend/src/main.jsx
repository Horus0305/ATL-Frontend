import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/index.js'
import './index.css'
import App from './App'
import Login from './pages/Login.jsx'
import { Route, Routes, Navigate } from "react-router-dom";
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/error-boundary'
import NotFound from './pages/NotFound'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/protected-route'

// Lazy load parent pages
const SuperAdminPage = lazy(() => import("./pages/superadmin"));
const ReceptionistPage = lazy(() => import("./pages/receptionist"));
const TesterPage = lazy(() => import("./pages/tester"));
const SectionHeadPage = lazy(() => import("./pages/sectionhead"));

// Lazy load child pages
const AllUsers = lazy(() => import("./pages/superadmin/AllUsers"));
const AllDetails = lazy(() => import("./pages/superadmin/Home"));
const Clients = lazy(() => import("./pages/receptionist/Clients"));
const TestDetails = lazy(() => import("./pages/tester/TestDetails"));
const ReceptionistHome = lazy(() => import("./pages/receptionist/Home"));
const TestsPage = lazy(() => import("./pages/common/TestsPage"));
const TestDetailsPage = lazy(() => import("./pages/common/TestDetailsPage.jsx"));
const AddTest = lazy(() => import("./pages/common/AddTest"));
const Home = lazy(() => import("./pages/sectionhead/Home"));
const SectionNotFound = lazy(() => import("./components/section-not-found"));
const Equipments = lazy(() => import("./pages/sectionhead/Equipments"));
const AddResults = lazy(() => import("./pages/results/AddResults"));

// Loading spinner component
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
  </div>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App>
        <Provider store={store}>
          <AuthProvider>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Login />} />

                  {/* SuperAdmin routes */}
                  <Route path="/superadmin" element={
                    <ProtectedRoute allowedRoles={[0]}>
                      <SuperAdminPage />
                    </ProtectedRoute>
                  }>
                    <Route index element={<AllDetails />} />
                    <Route path="users" element={<AllUsers />} />
                    <Route path="tests">
                      <Route index element={<TestsPage />} />
                      <Route path=":id" element={<TestDetailsPage />} />
                    </Route>
                    <Route path="*" element={<SectionNotFound />} />
                  </Route>

                  {/* Receptionist routes */}
                  <Route path="/receptionist" element={
                    <ProtectedRoute allowedRoles={[3]}>
                      <ReceptionistPage />
                    </ProtectedRoute>
                  }>
                    <Route index element={<ReceptionistHome />} />
                    <Route path="materialTests">
                      <Route index element={<TestsPage />} />
                      <Route path="addTest" element={<AddTest />} />
                      <Route path=":id" element={<TestDetailsPage />} />
                    </Route>
                    <Route path="clients" element={<Clients />} />
                    <Route path="*" element={<SectionNotFound />} />
                  </Route>

                  {/* Tester routes */}
                  <Route path="/tester" element={
                    <ProtectedRoute allowedRoles={[4, 5]}>
                      <TesterPage />
                    </ProtectedRoute>
                  }>
                    <Route index element={<TestsPage />} />
                    <Route path=":id" element={<TestDetailsPage />} />
                    <Route path=":id/add" element={<AddResults />} />
                    <Route path="*" element={<SectionNotFound />} />
                  </Route>

                  {/* Section Head routes */}
                  <Route path="/sectionhead" element={
                    <ProtectedRoute allowedRoles={[1, 2]}>
                      <SectionHeadPage />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Home />} />
                    <Route path="tests">
                      <Route index element={<TestsPage />} />
                      <Route path=":id" element={<TestDetailsPage />} />
                    </Route>
                    <Route path="equipments" element={<Equipments />} />
                    <Route path="*" element={<SectionNotFound />} />
                  </Route>

                  {/* 404 route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </AuthProvider>
        </Provider>
      </App>
    </BrowserRouter>
  </StrictMode>
);
