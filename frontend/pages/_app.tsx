import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { AppProvider } from "@/context/AppContext";
import LoadingModal from "@/components/LoadingModal";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    console.log("App Mounted");
    return () => {
      console.log("App Unmounted");
    };
  }, []);
  return (
    <AppProvider>
      <LoadingModal />
      <Component {...pageProps} />
    </AppProvider>
  );
}
