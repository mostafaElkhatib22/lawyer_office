import { ThemeProvider } from "@/context/ThemeContext";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: any) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
