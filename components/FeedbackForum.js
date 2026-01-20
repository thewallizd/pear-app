"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import TimeAgo from "@/components/TimeAgo";

export default function FeedbackForum({ myName }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [content, setContent] = useState("");
  const [type, setType] = useState("saran"); // 'saran' or 'keluhan'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Ambil data feedback
    const fetchFeedback = async () => {
      const { data } = await supabase.from("feedback").select("*").order("created_at", { ascending: false });
      if (data) setFeedbacks(data);
    };

    fetchFeedback();

    // 2. Realtime Listener
    const channel = supabase.channel("public_feedback")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "feedback" }, (payload) => {
        setFeedbacks((prev) => [payload.new, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "feedback" }, (payload) => {
        setFeedbacks((prev) => prev.map(f => f.id === payload.new.id ? payload.new : f));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    const { error } = await supabase.from("feedback").insert([{
      user_name: myName,
      content: content,
      type: type,
      status: "menunggu"
    }]);

    if (!error) {
      setContent("");
      alert("Terima kasih! Aspirasimu sudah dicatat. 🍐");
    } else {
      alert("Gagal mengirim.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 text-9xl opacity-10 rotate-12">📢</div>
        <h2 className="text-2xl font-black mb-1">Kotak Suara Warga</h2>
        <p className="text-yellow-50 text-sm">Punya ide fitur atau mau lapor bug? Sampaikan di sini!</p>
      </div>

      {/* FORM INPUT */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-4 mb-3">
            <label className={`flex-1 cursor-pointer p-3 rounded-xl border-2 text-center font-bold transition ${type === 'saran' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400'}`}>
              <input type="radio" name="type" className="hidden" onClick={() => setType("saran")} />
              💡 Saran
            </label>
            <label className={`flex-1 cursor-pointer p-3 rounded-xl border-2 text-center font-bold transition ${type === 'keluhan' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-100 text-gray-400'}`}>
              <input type="radio" name="type" className="hidden" onClick={() => setType("keluhan")} />
              🔥 Keluhan
            </label>
          </div>
          
          <textarea 
            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-500 text-sm mb-3"
            rows="3"
            placeholder={type === 'saran' ? "Gimana kalau ditambah fitur..." : "Min, ada error di bagian..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          <div className="flex justify-end">
             <button disabled={loading || !content.trim()} className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-black transition disabled:opacity-50">
               {loading ? "Mengirim..." : "Kirim Aspirasi 📨"}
             </button>
          </div>
        </form>
      </div>

      {/* LIST ASPIRASI */}
      <div className="space-y-4 pb-20">
        <h3 className="font-bold text-gray-700 px-2">Aspirasi Terbaru</h3>
        
        {feedbacks.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Belum ada aspirasi. Jadilah yang pertama!</div>
        ) : (
          feedbacks.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
              
              {/* Type Badge */}
              <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold text-white ${item.type === 'saran' ? 'bg-green-400' : 'bg-red-400'}`}>
                {item.type === 'saran' ? '💡 SARAN' : '🔥 KELUHAN'}
              </div>

              <div className="flex gap-3 mb-2">
                <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${item.user_name}&backgroundColor=c0aede,b6e3f4&radius=50`} className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200" />
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">@{item.user_name}</h4>
                  <p className="text-[10px] text-gray-400"><TimeAgo timestamp={item.created_at} /></p>
                </div>
              </div>

              <p className="text-gray-700 text-sm leading-relaxed mb-3">{item.content}</p>

              {/* Status & Response */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Status:</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.status === 'selesai' ? 'bg-green-100 text-green-700' : item.status === 'dibaca' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                      {item.status.toUpperCase()}
                    </span>
                 </div>
                 {/* Jika Admin sudah balas, tampilkan di sini (bisa dikembangkan nanti) */}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}