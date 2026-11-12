"use client";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function ListAduanRT() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAduan = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/complaints", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setComplaints(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAduan();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3000/complaints/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      Swal.fire("Berhasil!", "Status aduan telah diperbarui.", "success");
      fetchAduan(); // Refresh list
    } catch (error) {
      Swal.fire("Gagal!", "Gagal memperbarui status.", "error");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">Daftar Aduan Warga (RT)</h2>
      
      {loading ? (
        <p className="dark:text-white">Memuat data...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="p-3 dark:text-gray-300">Tanggal</th>
                <th className="p-3 dark:text-gray-300">Pelapor</th>
                <th className="p-3 dark:text-gray-300">Judul Aduan</th>
                <th className="p-3 dark:text-gray-300">Status</th>
                <th className="p-3 dark:text-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((item: any) => (
                <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-3 dark:text-gray-300">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 dark:text-gray-300">{item.user.name}</td>
                  <td className="p-3 dark:text-gray-300">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <select 
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      value={item.status}
                      className="p-1 border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Proses</option>
                      <option value="RESOLVED">Selesai</option>
                    </select>
                  </td>
                </tr>
              ))}
              {complaints.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-3 text-center dark:text-gray-400">Belum ada aduan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}