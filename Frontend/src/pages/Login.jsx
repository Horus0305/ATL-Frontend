import React from "react";
import logo from "@/assets/avantlogo.png";
import { LoginForm } from "../components/login-form";

function Login() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-white ">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a
            href="/"
            className="flex items-center gap-2 font-medium text-black"
          >
            <div className="flex items-center justify-center w-6 h-6 bg-white rounded-md">
              <img src={logo} alt="ATL" />
            </div>
            <b>Avant Tech Lab</b>
          </a>
        </div>
        <div className="flex items-center justify-center flex-1">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1591955506264-3f5a6834570a?fm=jpg&q=60&w=3000"
          alt="Image"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

export default Login;
