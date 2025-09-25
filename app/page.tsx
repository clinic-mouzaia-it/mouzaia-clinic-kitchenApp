"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import NextImage from "next/image";

import jsQR from "jsqr";

export default function Home() {
  const today = new Date().toISOString().split("T")[0];

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [period, setPeriod] = useState("");

  // Sample data (replace with real API data)
  const items = [
    { id: 1, name: "Italian Pasta", date: "2025-09-17", period: "lunch" },
    { id: 2, name: "Grilled Chicken", date: "2025-09-17", period: "dinner" },
    { id: 3, name: "Sushi", date: "2025-09-18", period: "lunch" },
  ];

  const filteredItems = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());

    const itemDate = new Date(item.date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const matchFrom = from ? itemDate >= from : true;
    const matchTo = to ? itemDate <= to : true;
    const matchPeriod = period ? item.period === period : true;

    return matchSearch && matchFrom && matchTo && matchPeriod;
  });

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredItems);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Results");
    XLSX.writeFile(workbook, "filtered-results.xlsx");
  };

  const [qrItem, setQrItem] = useState<any | null>(null);
  const [scanning, setScanning] = useState(false);

  async function scanPublicQRImage() {
    setScanning(true);
    const image = new Image();
    image.crossOrigin = "anonymous"; // important to avoid CORS issues
    image.src = "/bellounes.png";

    image.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        alert("Failed to get canvas context.");
        setScanning(false);
        return;
      }

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const qrCode = jsQR(imageData.data, canvas.width, canvas.height);

      if (qrCode?.data) {
        console.log("QR code data:", qrCode.data);

        try {
          const res = await fetch("/api/get-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: qrCode.data }),
          });

          const data = await res.json();

          if (!res.ok) throw new Error(data.error || "Item not found");

          setQrItem(data);
        } catch (error: any) {
          alert(error.message || "Failed to fetch item.");
          setQrItem(null);
        }
      } else {
        alert("No QR code detected in the image.");
        setQrItem(null);
      }

      setScanning(false);
    };

    image.onerror = () => {
      alert("Failed to load QR code image.");
      setScanning(false);
    };
  }

  return (
    <div className="font-sans grid grid-rows-[auto_1fr_auto] items-start justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      {/* Header: Logo and Brand */}
      <header className="flex items-center gap-4 row-start-1">
        <NextImage src="/Logo.png" alt="Logo" width={40} height={40} />
        <h1 className="text-2xl font-bold">La cuisine</h1>
      </header>

      {/* Main Content */}
      <main className="flex flex-col gap-8 row-start-2 w-full max-w-4xl">
        {/* Search + Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          {/* Search */}
          <div className="flex flex-col w-full sm:w-[200px]">
            <label className="text-sm font-medium mb-1">Search:</label>
            <input
              type="text"
              placeholder="Search a name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-4 py-2 rounded"
            />
          </div>

          {/* From Date */}
          <div className="flex flex-col w-full sm:w-[150px]">
            <label className="text-sm font-medium mb-1">From:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border px-4 py-2 rounded"
            />
          </div>

          {/* To Date */}
          <div className="flex flex-col w-full sm:w-[150px]">
            <label className="text-sm font-medium mb-1">To:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border px-4 py-2 rounded"
            />
          </div>

          {/* Period */}
          <div className="flex flex-col w-full sm:w-[150px]">
            <label className="text-sm font-medium mb-1">Period:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border px-4 py-2 rounded"
            >
              <option value="">All Periods</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>

          {/* Scan QR Code Button */}
          <div className="flex flex-col justify-end w-full sm:w-auto">
            <button
              onClick={scanPublicQRImage}
              disabled={scanning}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              {scanning ? "Scanning..." : "Scan QR Code"}
            </button>
          </div>
        </div>

        {/* Display scanned QR item info */}
        {qrItem && (
          <div className="border p-4 rounded bg-green-50 mt-4">
            <h2 className="font-bold text-lg mb-2">Scanned Item Info</h2>
            <p><strong>ID:</strong> {qrItem.id}</p>
            <p><strong>Name:</strong> {qrItem.fullName}</p>
            <p><strong>position:</strong> {qrItem.departement}</p>
            <p><strong>position:</strong> {qrItem.position}</p>
            <p><strong>level:</strong> {qrItem.level}</p>
            {/* Add any other fields from your DB */}
          </div>
        )}

        {/* Filtered Results */}
        <ul className="space-y-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <li key={item.id} className="border p-4 rounded shadow-sm">
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <p className="text-sm text-gray-500">
                  {item.date} — {item.period}
                </p>
              </li>
            ))
          ) : (
            <p className="text-gray-500">No items found.</p>
          )}
        </ul>

        {/* Export Button at Bottom */}
        <div className="flex justify-end">
          <button
            onClick={handleExport}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Export to Excel
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-sm text-gray-400">
        © {new Date().getFullYear()} La cuisine. All rights reserved.
      </footer>
    </div>
  );
}
