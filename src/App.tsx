import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import Login from "./pages/AuthPages/Login";
import Register from "./pages/AuthPages/Register";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Invoices from "./pages/Invoices/Invoices";
import CreateInvoice from "./pages/Invoices/CreateInvoice";
import ReviewAndSendInvoice from "./pages/Invoices/ReviewAndSendInvoice";
import Quotes from "./pages/Quotes/Quotes";
import CreateQuote from "./pages/Quotes/CreateQuote";
import ReviewAndSendQuote from "./pages/Quotes/ReviewAndSendQuote";
import Clients from "./pages/Clients/Clients";
import ClientDetail from "./pages/Clients/ClientDetail";

export default function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />

            {/* Protected Dashboard Layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index path="/" element={<Home />} />

              {/* Invoices */}
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/create" element={<CreateInvoice />} />
              <Route path="/invoices/review" element={<ReviewAndSendInvoice />} />

              {/* Quotes */}
              <Route path="/quotes" element={<Quotes />} />
              <Route path="/quotes/create" element={<CreateQuote />} />
              <Route path="/quotes/review" element={<ReviewAndSendQuote />} />

              {/* Clients */}
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetail />} />

              {/* Others Page */}
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />

              {/* Forms */}
              <Route path="/form-elements" element={<FormElements />} />

              {/* Tables */}
              <Route path="/basic-tables" element={<BasicTables />} />

              {/* Ui Elements */}
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />

              {/* Charts */}
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}
