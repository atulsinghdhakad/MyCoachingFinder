import { useEffect, useState } from 'react';
import { auth } from '../firebase';

const AdminNavbar = () => {
  const [photoURL, setPhotoURL] = useState(localStorage.getItem('adminPhotoURL'));

  useEffect(() => {
    const refreshPhoto = async () => {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        const updatedURL = user.photoURL;
        if (updatedURL !== photoURL) {
          localStorage.setItem('adminPhotoURL', updatedURL);
          setPhotoURL(updatedURL);
        }
      }
    };

    refreshPhoto();
    const interval = setInterval(refreshPhoto, 60000);
    return () => clearInterval(interval);
  }, [photoURL]);

  return (
    <div className="flex items-center space-x-3">
      {photoURL && (
        <img src={photoURL} alt="Admin Avatar" className="w-10 h-10 rounded-full border-2 border-white" />
      )}
      <span className="text-white font-semibold">Admin</span>
    </div>
  );
};

export default AdminNavbar;
