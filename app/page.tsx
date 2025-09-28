"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import NextImage from "next/image";
import jsQR from "jsqr";

interface HistoryRecord {
  id: number;
  fullName: string;
  date: string; // ISO string
  period: string;
  level?: string;
}

export default function Home() {
  const today = new Date().toISOString().split("T")[0];

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [period, setPeriod] = useState("");

  const [historyItems, setHistoryItems] = useState<HistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [qrItem, setQrItem] = useState<HistoryRecord | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      setLoadingHistory(true);
      try {
        const res = await fetch("/api/get-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: fromDate,
            endDate: toDate,
            period: period,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch history");

        console.log("Fetched history:", data.history);
        setHistoryItems(data.history);
      } catch (err: any) {
        console.error("Error fetching history:", err.message);
      } finally {
        setLoadingHistory(false);
      }
    }

    fetchHistory();
  }, [fromDate, toDate, period]);

  // ✅ Only apply search filter (backend already filters by date/period)
  const filteredItems = historyItems.filter((item) =>
    item.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredItems);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered History");
    XLSX.writeFile(workbook, "history-export.xlsx");
  };

  async function scanPublicQRImage() {
  setScanning(true);

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = "/hamrat-anes.png";

  image.onload = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      alert("❌ Failed to get canvas context.");
      setScanning(false);
      return;
    }

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsQR(imageData.data, canvas.width, canvas.height);

    if (!qrCode?.data) {
      alert("❌ No QR code detected in the image.");
      setQrItem(null);
      setScanning(false);
      return;
    }

    try {
      const res = await fetch("/api/get-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: qrCode.data }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "User not found");

      setQrItem(data);

      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      const isLunchTime = hour >= 11 && hour < 16;
      const isDinnerTime =
        (hour === 18 && minute >= 30) ||
        (hour > 18 && hour < 21) ||
        (hour === 21 && minute <= 30);

      if (!isLunchTime && !isDinnerTime) {
        alert(
          "⏰ It's not time yet. Allowed times:\n- 11:00 to 15:00\n- 18:30 to 21:30"
        );
        setScanning(false);
        return;
      }

      const periodValue = isLunchTime ? "lunch" : "dinner";

      // ✅ Check if already exists today for the same period
      const alreadyExists = historyItems.some((record) => {
        const sameDate =
          new Date(record.date).toISOString().split("T")[0] ===
          now.toISOString().split("T")[0];
        const samePeriod = record.period === periodValue;
        const sameUser = record.id === data.id;
        return sameDate && samePeriod && sameUser;
      });

      if (alreadyExists) {
        alert(
          `⚠️ This user has already been registered for ${periodValue} today.`
        );
        setScanning(false);
        return;
      }

      // ✅ Add to history
      const addRes = await fetch("/api/add-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          level: data.level,
          date: now.toISOString(),
          period: periodValue,
        }),
      });

      const addData = await addRes.json();
      if (!addRes.ok)
        throw new Error(addData.error || "Failed to add to history");

      setHistoryItems((prev) => [...prev, addData.newRecord]);
    } catch (err: any) {
      alert("⚠️ " + (err.message || "Unexpected error."));
      setQrItem(null);
    } finally {
      setScanning(false);
    }
  };

  image.onerror = () => {
    alert("❌ Failed to load QR code image.");
    setScanning(false);
  };
}


  return (
    <div className="font-sans grid grid-rows-[auto_1fr_auto] items-start justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <header className="flex items-center gap-4 row-start-1">
        <NextImage src="/Logo.png" alt="Logo" width={40} height={40} />
        <h1 className="text-2xl font-bold">La cuisine</h1>
      </header>

      <main className="flex flex-col gap-8 row-start-2 w-full max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
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

          <div className="flex flex-col w-full sm:w-[150px]">
            <label className="text-sm font-medium mb-1">From:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border px-4 py-2 rounded"
            />
          </div>

          <div className="flex flex-col w-full sm:w-[150px]">
            <label className="text-sm font-medium mb-1">To:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border px-4 py-2 rounded"
            />
          </div>

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

        {/* Show scanned user / history info */}
        {qrItem && (
          <div className="border p-4 rounded bg-green-50 mt-4">
            <h2 className="font-bold text-lg mb-2">Scanned Info</h2>
            <p>
              <strong>ID:</strong> {qrItem.id}
            </p>
            <p>
              <strong>Name:</strong> {qrItem.fullName}
            </p>
          </div>
        )}

        {/* Show filtered history list */}
        <ul className="space-y-4">
          {loadingHistory && <p>Loading history...</p>}
          {!loadingHistory && filteredItems.length === 0 && (
            <p className="text-gray-500">No records found.</p>
          )}
          {!loadingHistory &&
            filteredItems.map((item) => (
              <li key={item.id} className="border p-4 rounded shadow-sm">
                <h2 className="text-lg font-semibold">{item.fullName}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(item.date).toLocaleString()} — {item.period}
                </p>
              </li>
            ))}
        </ul>

        <div className="flex justify-end">
          <button
            onClick={handleExport}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Export to Excel
          </button>
        </div>
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-sm text-gray-400">
        © {new Date().getFullYear()} La cuisine. All rights reserved.
      </footer>
    </div>
  );
}
