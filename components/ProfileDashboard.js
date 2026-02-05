'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User, MapPin, Link as LinkIcon, Edit3, Save } from "lucide-react";

export default function ProfileDashboard({ myName }) {
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    location: "",
    website: "",
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Pindahkan useEffect ke BAWAH fungsi fetchMyData biar rapi (Optional)
  const fetchMyData = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", myName)
      .single();

    if (profileData) {
      setFormData({
        full_name: profileData.full_name || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
        website: profileData.website || "",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMyData();

    const channel = supabase
      .channel("profile_dashboard_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `username=eq.${myName}` },
        (payload) => {
          setFormData((prev) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myName]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    await supabase.from("profiles").update(formData).eq("username", myName);
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm sticky top-24 animate-in fade-in text-center group transition-colors">
      <div className="relative inline-block">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg mb-4">
          {formData.full_name ? formData.full_name[0].toUpperCase() : myName[0].toUpperCase()}
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="absolute bottom-0 right-0 p-2 bg-gray-900 text-white rounded-full shadow-md hover:scale-110 transition"
        >
          {isEditing ? <Save size={14} /> : <Edit3 size={14} />}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-3 mt-2">
          <input
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Nama Lengkap"
            className="w-full p-2 border rounded-lg text-sm dark:bg-slate-700 dark:text-white"
          />
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Bio Singkat"
            className="w-full p-2 border rounded-lg text-sm dark:bg-slate-700 dark:text-white"
          />
          <div className="flex gap-2">
             <input name="location" value={formData.location} onChange={handleChange} placeholder="Lokasi" className="w-full p-2 border rounded-lg text-xs dark:bg-slate-700 dark:text-white" />
          </div>
           <input name="website" value={formData.website} onChange={handleChange} placeholder="Website" className="w-full p-2 border rounded-lg text-xs dark:bg-slate-700 dark:text-white" />
          
           <button onClick={handleSave} className="w-full py-2 bg-green-500 text-white rounded-lg text-xs font-bold">Simpan Perubahan</button>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-black text-gray-800 dark:text-white">{formData.full_name || myName}</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">@{myName}</p>

          <p className="text-gray-600 dark:text-slate-300 text-sm mb-4 leading-relaxed">
            {formData.bio || "Belum ada bio. Tulis sesuatu yang keren!"}
          </p>

          <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-slate-400">
            {formData.location && (
              <div className="flex items-center justify-center gap-2">
                <MapPin size={14} /> {formData.location}
              </div>
            )}
            {formData.website && (
              <div className="flex items-center justify-center gap-2 text-blue-500">
                <LinkIcon size={14} /> 
                <a href={formData.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[200px]">
                  {formData.website}
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}