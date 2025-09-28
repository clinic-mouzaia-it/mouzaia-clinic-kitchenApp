"use client";

import React, { useState } from "react";

type User = {
  id: bigint;
  fullName: string;
  position: string;
  level: string;
  department: string | null;
};

type AddUserModalProps = {
  onClose: () => void;
  onUserAdded: (newUser: User) => void;
};

const AddUserModal: React.FC<AddUserModalProps> = ({
  onClose,
  onUserAdded,
}) => {
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState<number | "">(""); // allow "" for unselected
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  const [errors, setErrors] = useState({
    fullName: "",
    position: "",
    level: "",
  });

  const handleAdd = async () => {
    const newErrors = {
      fullName: "",
      position: "",
      level: "",
    };

    if (!fullName.trim()) newErrors.fullName = "Full Name is required.";
    if (!position.trim()) newErrors.position = "Position is required.";
    if (level === "" || isNaN(Number(level)))
      newErrors.level = "Level is required.";

    const hasErrors = Object.values(newErrors).some((msg) => msg !== "");

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setErrors({ fullName: "", position: "", level: "" });
    setLoading(true);
    setNotification(null);

    try {
      const res = await fetch("/api/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          position,
          level: Number(level), // ensure it's a number for Prisma
          department: department.trim() === "" ? null : department,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Add user failed");

      setNotification({
        type: "success",
        message: "User successfully created!",
      });

      onUserAdded(data.user);

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Error adding user",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md space-y-4 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Add New User</h2>

        {notification && (
          <div
            className={`p-2 rounded text-center ${
              notification.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {notification.message}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <input
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setErrors((prev) => ({ ...prev, fullName: "" }));
              }}
              placeholder="Full Name"
              className="w-full border px-4 py-2 rounded"
            />
            {errors.fullName && (
              <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          <div>
            <input
              value={position}
              onChange={(e) => {
                setPosition(e.target.value);
                setErrors((prev) => ({ ...prev, position: "" }));
              }}
              placeholder="Position"
              className="w-full border px-4 py-2 rounded"
            />
            {errors.position && (
              <p className="text-red-600 text-sm mt-1">{errors.position}</p>
            )}
          </div>

          <div>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Department (optional)"
              className="w-full border px-4 py-2 rounded"
            />
          </div>

          <div>
            <select
              value={level}
              onChange={(e) => {
                setLevel(parseInt(e.target.value, 10));
                setErrors((prev) => ({ ...prev, level: "" }));
              }}
              className="w-full border px-4 py-2 rounded"
            >
              <option value="">Select Level</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
            {errors.level && (
              <p className="text-red-600 text-sm mt-1">{errors.level}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="bg-gray-100 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
