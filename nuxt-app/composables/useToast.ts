import { toast, type ToastOptions } from "vue3-toastify";

export function useToast() {
  const notify = (message: string, type: "success" | "error") => {
    const options: ToastOptions = {
      autoClose: 3000,
      position: toast.POSITION.TOP_RIGHT,
      pauseOnHover: true,
      transition: "slide",
      progressStyle: {
        background: type === "success" ? "green" : "red",
      },
      toastStyle: {
        color: type === "success" ? "lightgreen" : "red",
        border: "1px solid white",
      },
      theme: "dark",
      closeOnClick: true,
    };

    toast(message, options);
  };

  return { notify };
}
