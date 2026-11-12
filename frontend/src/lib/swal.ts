import Swal from 'sweetalert2';

// Konfigurasi Default agar sesuai dengan desain aplikasi
export const showConfirm = async (title: string, text: string, confirmText = 'Ya, Lanjutkan') => {
  const isDarkMode = document.documentElement.classList.contains('dark');

  return await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#2563eb', // Warna biru utama
    cancelButtonColor: '#6b7280',  // Warna abu-abu
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
    background: isDarkMode ? '#1f2937' : '#ffffff',
    color: isDarkMode ? '#f3f4f6' : '#1f2937',
    customClass: {
      popup: 'rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700',
      title: 'text-xl font-bold',
      confirmButton: 'px-6 py-2 rounded-xl font-semibold',
      cancelButton: 'px-6 py-2 rounded-xl font-semibold'
    }
  });
};

export const showSuccess = (title: string, text?: string) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonColor: '#10b981',
    background: isDarkMode ? '#1f2937' : '#ffffff',
    color: isDarkMode ? '#f3f4f6' : '#1f2937',
    customClass: {
      popup: 'rounded-2xl shadow-xl',
      confirmButton: 'px-6 py-2 rounded-xl font-semibold'
    }
  });
};

export const showError = (title: string, text?: string) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: '#ef4444',
    background: isDarkMode ? '#1f2937' : '#ffffff',
    color: isDarkMode ? '#f3f4f6' : '#1f2937',
    customClass: {
      popup: 'rounded-2xl shadow-xl',
      confirmButton: 'px-6 py-2 rounded-xl font-semibold'
    }
  });
};