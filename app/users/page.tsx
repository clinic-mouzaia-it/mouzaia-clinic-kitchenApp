"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"; // Outline icons for edit/delete

type User = {
  id: string;
  fullName: string;
  position?: string;
  level?: string;
};

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) =>
      user.fullName.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/get-all-users");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch users");

      setUsers(data);
      setFilteredUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/delete-user?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (err: any) {
      alert(err.message || "Error deleting user");
    }
  };

  return (
    <div className="font-sans grid grid-rows-[auto_1fr_auto] items-start justify-items-center min-h-screen p-6 sm:p-12 pb-20 gap-10 bg-gray-50">
      {/* Header */}
      <header className="flex items-center gap-4 row-start-1">
        <Image src="/Logo.png" alt="Logo" width={40} height={40} />
        <h1 className="text-2xl font-bold text-gray-800">
          La cuisine: Admin interface
        </h1>
      </header>

      {/* Main */}
      <main className="flex flex-col gap-8 row-start-2 w-full max-w-4xl">
        {/* Search & Add */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex flex-col w-full sm:w-[300px]">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Search by Full Name:
            </label>
            <input
              type="text"
              placeholder="e.g., Bellounes"
              className="border border-gray-300 px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={() => alert("Add User functionality not implemented yet.")}
            className="bg-green-600 text-white px-5 py-2 rounded shadow hover:bg-green-700 transition"
          >
            + Add New User
          </button>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-gray-600">Loading users...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (
          <ul className="space-y-4">
            {filteredUsers.map((user) => (
              <li
                key={user.id}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition duration-150"
              >
                <div className="flex justify-between items-start sm:items-center gap-4">
                  {/* Info */}
                  <div>
                    <p className="text-lg font-semibold text-gray-800 mb-1">
                      {user.fullName}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">ID:</span> {user.id}
                    </p>
                    {user.position && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Position:</span>{" "}
                        {user.position}
                      </p>
                    )}
                    {user.level && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Level:</span> {user.level}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        alert(`Edit functionality for ${user.fullName}`)
                      }
                      title="Edit"
                      className="group flex items-center gap-1 text-blue-500 hover:text-blue-700 transition text-sm font-medium"
                    >
                      <PencilSquareIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      onClick={() => handleDelete(user.id)}
                      title="Delete"
                      className="group flex items-center gap-1 text-red-500 hover:text-red-700 transition text-sm font-medium"
                    >
                      <TrashIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Footer */}
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-sm text-gray-400">
        © {new Date().getFullYear()} Mouzaia Clinic Kitchen. All rights reserved.
      </footer>
    </div>
  );
};

export default Users;
