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

        setHistoryItems(data.history);
      } catch (err: any) {
        console.error("Error fetching history:", err.message);
      } finally {
        setLoadingHistory(false);
      }
    }

    fetchHistory();
  }, [fromDate, toDate, period]);

  const filteredItems = historyItems.filter((item) =>
    item.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredItems);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered History");
    XLSX.writeFile(workbook, "cuisine.xlsx");
  };

  async function scanPublicQRImage() {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      alert("❌ Camera access is not supported in this environment.");
      return;
    }

    setScanning(true);

    const video = document.createElement("video");
    video.setAttribute("playsinline", "true"); // Prevent iOS from fullscreen
    video.style.position = "fixed";
    video.style.top = "50%";
    video.style.left = "50%";
    video.style.transform = "translate(-50%, -50%)";
    video.style.width = "100%";
    video.style.maxWidth = "500px";
    video.style.zIndex = "1000";
    video.style.border = "2px solid #00FF00"; // optional border
    video.setAttribute("playsinline", "true");

    document.body.appendChild(video);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },

      });
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        alert("❌ Failed to get canvas context.");
        stopStream(stream);
        video.remove();
        setScanning(false);
        return;
      }

      const scan = async () => {
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
          requestAnimationFrame(scan);
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, canvas.width, canvas.height);

        if (qrCode?.data) {
          stopStream(stream);
          video.remove();

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

            const isLunchTime = hour >= 11 && hour < 15;
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
        } else {
          requestAnimationFrame(scan); // Keep scanning
        }
      };

      requestAnimationFrame(scan);
    } catch (err: any) {
      alert("❌ Unable to access camera: " + (err.message || err));
      video.remove();
      setScanning(false);
    }

    function stopStream(stream: MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
    }
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

        <ul className="space-y-4">
          {loadingHistory && <p>Loading history...</p>}
          {!loadingHistory && filteredItems.length === 0 && (
            <p className="text-gray-500">No records found.</p>
          )}
          {!loadingHistory &&
            filteredItems.map((item) => (
              <li key={item.id} className="border p-4 rounded shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold">{item.fullName}</h2>
                    <p className="text-sm text-gray-500">
                      {new Date(item.date).toLocaleString()} — {item.period}
                    </p>
                  </div>
                </div>
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
