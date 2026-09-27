import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initialLang } from "./i18n";

document.documentElement.dir = initialLang === "ar" ? "rtl" : "ltr";
document.documentElement.lang = initialLang;

createRoot(document.getElementById("root")!).render(<App />);
