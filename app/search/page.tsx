"use client";
import SearchResult from '@/components/layout/SearchResult';
import React, { useState } from 'react';

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

function SearchPage() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [resultArr, setResultArr] = useState<Case[]>([]);

  async function getResult(): Promise<void> {
    let res = await SearchResult(searchTerm);
    const cases: Case[] = res.map((item: any) => ({
      ...item,
      caseNumber: Number(item.caseNumber),
    }));
    setResultArr(cases);
    console.log(resultArr)
  }
  return (
    <div>
      <form onSubmit={e=>e.preventDefault()} className="mr-2 p-2 flex items-center">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={
               "w-[150px] border-2 border-violet-400 md:w-[300px] lg:w-[400px] rounded-lg outline-none h-[40px] p-3"
              }
              placeholder="ابحث عن موكل أو قضية"
            />
            <button onClick={getResult} className="ml-2 bg-violet-500 text-white px-4 py-2 rounded-lg">
              بحث
            </button>
          </form>
    </div>
  );
}

export default SearchPage;
