"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2"; // Pastikan sweetalert2 sudah terinstall di frontend

export default function FormAduanPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // Sesuaikan dengan cara Anda menyimpan token
      
      // Sesuaikan URL dengan port backend Anda (biasanya 3000 atau 3001)
      const res = await fetch("http://localhost:3000/complaints", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      if (res.ok) {
        Swal.fire("Berhasil!", "Aduan Anda telah terkirim ke RT/RW.", "success");
        router.push("/dashboard/warga"); // Kembali ke dashboard
      } else {
        throw new Error("Gagal mengirim aduan");
      }
    } catch (error) {
      Swal.fire("Gagal!", "Terjadi kesalahan saat mengirim aduan.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">Buat Aduan Baru</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Judul Aduan</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Lampu Jalan RT 01 Mati"
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Deskripsi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Jelaskan detail aduan Anda..."
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? "Mengirim..." : "Kirim Aduan"}
        </button>
      </form>
    </div>
  );
}