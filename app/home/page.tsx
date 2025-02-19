"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaBalanceScale } from "react-icons/fa";
import { RiCustomerService2Line } from "react-icons/ri";
import { SiSession } from "react-icons/si";

interface Case {
  _id: string;
  caseTypeOF: string;
  type: string;
  court: string;
  caseNumber: number;
  sessiondate: string;
  decision: string;
  year: number;
  attorneyNumber: string;
  caseDate: string;
  opponents: string[];
  nots: string;
  files: string[];
  client: { _id: string; name: string };
}

interface Client {
  _id: string;
  name: string;
  caseCount: number;
}

const fetchData = async (
  url: string,
  setData: React.Dispatch<React.SetStateAction<any>>
) => {
  try {
    const res = await axios.get(url);
    setData(res.data.data);
  } catch (error) {
    console.log(error);
  }
};

function HomePage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetchData("/api/cases", setCases);
    fetchData("/api/clients", setClients);
  }, []);

  console.log(cases, clients);

  return (
    <div className="flex flex-col justify-center items-center w-full bg-purple-100 ">
      <div className="flex flex-col justify-center items-center w-full h-screen">
        <div className="flex justify-between items-center gap-6 w-full h-screen mb-4">
          <div className="w-full h-screen flex justify-center items-center">
            <img
              src="https://lawyer-consultancy-web-frontent.vercel.app/3d-cartoon-portrait-person-practicing-law-profession.png"

              alt="Logo Home"
              className="w-full lg:w-full lg:h-screen"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col justify-center items-center w-full h-screen">
            <h1 className="text-[16px] md:text-4xl lg:text-6xl font-extrabold font-sans">
              الاستاذ/ مصطفى الخطيب
              <br />
              الاستاذ/ السيد الشيشيني
            </h1>
            <p className="text-[16px] md:text-4xl lg:text-6xl font-extrabold font-sans">
              للاستشارات القانونية{" "}
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center gap-[20px] lg:gap-[100px] m-[20px]">
        <div className="flex flex-col justify-center items-center hover:scale-[1.2] transition-all ease-linear">
          <FaBalanceScale size={60} />
          <h1 className="text-[13px] md:text-2xl lg:text-2xl font-semibold">
            {cases.length}
          </h1>
          <p className="text-[13px] md:text-2xl lg:text-2xl font-semibold">
            عدد الدعاوي
          </p>
        </div>
        <div className="flex flex-col justify-center items-center hover:scale-[1.2] transition-all ease-linear">
          <RiCustomerService2Line size={60} />
          <h1 className="text-[13px] md:text-2xl lg:text-2xl font-semibold">
            {clients.length}
          </h1>
          <p className="text-[13px] md:text-2xl lg:text-2xl font-semibold">
            عدد الموكلين
          </p>
        </div>
        <div className="flex flex-col justify-center items-center hover:scale-[1.2] transition-all ease-linear">
          <SiSession size={60} />
          <h1 className="text-[13px] md:text-2xl lg:text-2xl font-semibold">
            {
              cases.filter((e) => {
                const sessionDate = new Date(e.sessiondate);
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                return (
                  sessionDate.getDate() === tomorrow.getDate() &&
                  sessionDate.getMonth() === tomorrow.getMonth() &&
                  sessionDate.getFullYear() === tomorrow.getFullYear()
                );
              }).length
            }
          </h1>
          <p className="text-[13px] md:text-2xl lg:text-2xl font-semibold">
            جلسات غدا
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
