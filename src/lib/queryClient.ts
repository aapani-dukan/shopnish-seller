import { QueryClient, QueryFunction } from "@tanstack/react-query";
import api from "../services/api"; 
import { logoutUser } from "./firebase"; // Humne pichle step mein logoutUser naam rakha tha

export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  path: string,
  data?: any
): Promise<any> {
  try {
    const config: any = {
      method,
      url: path,
    };

    // GET के लिए params और बाकी के लिए data (body)
    if (method === "GET" && data) {
      config.params = data;
    } else if (data) {
      config.data = data;
    }

    const res = await api(config);
    return res.data;
  } catch (error: any) {
    if (error.response) {
      // सर्वर से एरर मैसेज निकालें
      const message = error.response.data.message || error.response.data.error || "Request failed";
      const customError: any = new Error(message);
      customError.status = error.response.status;

      // अगर टोकन एक्सपायर हो गया (401)
      if (error.response.status === 401) {
        console.warn("Session expired. Logging out...");
        await logoutUser(); 
      }
      throw customError;
    }
    // अगर इंटरनेट न हो या सर्वर डाउन हो
    throw new Error("Network issue. Please check your connection.");
  }
}

export const getQueryFn = <T,>(): QueryFunction<T | null> =>
  async ({ queryKey }) => {
    const path = queryKey[0] as string;
    // QueryKey के दूसरे एलिमेंट को Params की तरह इस्तेमाल करें
    const params = queryKey.length > 1 ? queryKey[1] : undefined; 

    const res = await apiRequest("GET", path, params);
    return res as T;
  };

// Global Query Client Configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      refetchOnWindowFocus: false, // मोबाइल में ऐप स्विच करने पर बार-बार लोड न हो
      staleTime: 1000 * 60 * 5,    // 5 मिनट तक डेटा 'Fresh' माना जाएगा
      retry: (failureCount, error: any) => {
        // अगर 401 एरर है तो दोबारा कोशिश न करें, सीधा लॉगआउट करें
        if (error?.status === 401) return false;
        // बाकी एरर्स पर सिर्फ 1 बार और कोशिश करें
        return failureCount < 1;
      },
    },
  },
});