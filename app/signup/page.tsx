"use client";
import Link from "next/link";
import React, { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
interface UserData {
  name: string;
  email: string;
  password?: string;
}
export default function Register() {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>("");
  const [data, setData] = useState<UserData>({
    name: "",
    email: "",
    password: "",
  });
  const isValidEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };
  const handleOnChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValidEmail(data.email)) {
      setError("حساب غير صالح");
      return;
    }
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const dataApi = await res.json();
      if (dataApi.success) {
        toast.success(dataApi.message);
        router.push("/");
        setData({
          name: "",
          email: "",
          password: "",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "نعتذر",
          text: `${dataApi.message}`,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="mt-[20px] w-full items-center flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-[700px] flex justify-center items-center flex-col"
      >
        {renderInputField(
          "الاسم",
          "ادخل الاسم ",
          "name",
          data.name,
          "text",
          "",
          handleOnChange
        )}
        {renderInputField(
          "الحساب ",
          "ادخل الحساب ",
          "email",
          data.email,
          "email",
          "",
          handleOnChange
        )}

        {renderInputField(
          "كلمة السر ",
          "ادخل كلمةالسر ",
          "password",
          data.password || "",
          "text",
          "",
          handleOnChange
        )}

        <Button variant="destructive" type="submit">
          إضافة حساب
        </Button>
      </form>
    </div>
  );
}

const renderInputField = (
  label: string,
  placeholder: string,
  name: string,
  value: string,
  type = "text",
  additionalClass = "",
  handleOnChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
) => (
  <div>
    <label>{label} :</label>
    <Input
      placeholder={placeholder}
      name={name}
      value={value}
      onChange={handleOnChange}
      type={type}
      className={additionalClass}
    />
  </div>
);
