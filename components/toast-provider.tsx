"use client";

import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";

export function ToastProvider() {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={true}
      closeButton={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      transition={Slide}
    />
  );
}
