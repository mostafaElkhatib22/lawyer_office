"use client";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import toast from "react-hot-toast";

function AddClient() {
  const router = useRouter();
  const [data, setData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prev) => {
      return { ...prev, [name]: value };
    });
  };
  // اضافة خصم

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const dataApi = await res.json();
      if (dataApi.success) {
        toast.success(dataApi.message);
        router.push("/cases/add-case");
        setData({
          name: "",
          email: "",
          phone: "",
          address: "",
        });
      }
      if (dataApi.error) {
        return toast.error(dataApi.message);
      }
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className="max-w-[700px] h-[400px] items-center overflow-hidden flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="max-w-[400px] bg-white flex flex-col p-4 gap-4 justify-center overflow-hidden items-center text-center rounded-2xl shadow-lg shadow-black"
      >
        <div>
          <label>اسم الموكل :</label>
          <Input
            type="text"
            name="name"
            onChange={handleOnChange}
            value={data.name}
            placeholder="ادخل اسم الموكل"
          />
        </div>
        <div>
          <label>رقم تليفون الموكل :</label>
          <Input
            type="text"
            value={data.phone}
            onChange={handleOnChange}
            name="phone"
            placeholder="ادخل رقم تليفون الموكل"
          />
        </div>
        <div>
          <label>عنوان الموكل :</label>
          <Input
            type="text"
            name="address"
            value={data.address}
            onChange={handleOnChange}
            placeholder="ادخل عنوان الموكل"
          />
        </div>
        <div>
          <label>ايميل الموكل :</label>
          <Input
            type="email"
            value={data.email}
            name="email"
            onChange={handleOnChange}
            placeholder="ادخل ايميل الموكل"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
        >
          إضافة موكل
        </button>
      </form>
    </div>
  );
}

export default AddClient;
