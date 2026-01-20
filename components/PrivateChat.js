"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import TimeAgo from "@/components/TimeAgo";

const rtcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function PrivateChat({ myName, partnerName, onBack, onlineUsers }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  
  const isPartnerOnline = onlineUsers && onlineUsers.has(partnerName);
  const [callStatus, setCallStatus] = useState("idle"); 
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const durationInterval = useRef(null);

  useEffect(() => {
    const signalChannel = supabase.channel(`signal_${myName}_${partnerName}`)
      .on("broadcast", { event: "call-signal" }, async ({ payload }) => {
        if (payload.sender !== partnerName || payload.target !== myName) return;
        if (payload.type === "offer") {
          if (callStatus === "idle") {
            setCallStatus("incoming");
            peerConnection.current = createPeerConnection();
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          } else { sendSignal("busy"); }
        } else if (payload.type === "answer") {
          if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            setCallStatus("connected");
            startTimer();
          }
        } else if (payload.type === "ice-candidate") {
          if (peerConnection.current) { try { await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch (e) { console.error(e); } }
        } else if (payload.type === "hangup") { endCall(false); }
      })
      .subscribe();
    return () => { supabase.removeChannel(signalChannel); endCall(false); };
  }, [myName, partnerName]);

  const sendSignal = async (type, data = {}) => {
    await supabase.channel(`signal_${partnerName}_${myName}`).send({ type: "broadcast", event: "call-signal", payload: { sender: myName, target: partnerName, type, ...data } });
  };
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(rtcConfig);
    pc.onicecandidate = (event) => { if (event.candidate) sendSignal("ice-candidate", { candidate: event.candidate }); };
    pc.ontrack = (event) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0]; };
    return pc;
  };
  const startCall = async () => {
    try {
      setCallStatus("calling");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      peerConnection.current = createPeerConnection();
      stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      sendSignal("offer", { sdp: offer });
    } catch (err) { alert("Gagal akses Mic."); setCallStatus("idle"); }
  };
  const answerCall = async () => {
    try {
      setCallStatus("connected"); startTimer();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      sendSignal("answer", { sdp: answer });
    } catch (err) { endCall(); }
  };
  const endCall = (notifyParams = true) => {
    if (notifyParams) sendSignal("hangup");
    if (peerConnection.current) { peerConnection.current.close(); peerConnection.current = null; }
    if (localStream.current) { localStream.current.getTracks().forEach(track => track.stop()); localStream.current = null; }
    stopTimer(); setCallStatus("idle"); setIsMuted(false);
  };
  const startTimer = () => { setCallDuration(0); durationInterval.current = setInterval(() => { setCallDuration(prev => prev + 1); }, 1000); };
  const stopTimer = () => { if (durationInterval.current) clearInterval(durationInterval.current); setCallDuration(0); };
  const formatTime = (sec) => { const min = Math.floor(sec / 60); const s = sec % 60; return `${min}:${s < 10 ? '0' : ''}${s}`; };
  const toggleMute = () => { if (localStream.current) { localStream.current.getAudioTracks()[0].enabled = !localStream.current.getAudioTracks()[0].enabled; setIsMuted(!isMuted); } };

  // --- LOGIKA PESAN ---
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from("private_chat").select("*").or(`and(sender.eq.${myName},recipient.eq.${partnerName}),and(sender.eq.${partnerName},recipient.eq.${myName})`).order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // LISTEN ALL EVENTS (*) UNTUK MENANGKAP DELETE
    const channel = supabase.channel(`private_msg_${myName}_${partnerName}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "private_chat" }, (payload) => {
        if (payload.eventType === "INSERT") {
          if ((payload.new.sender === myName && payload.new.recipient === partnerName) || (payload.new.sender === partnerName && payload.new.recipient === myName)) { 
            setMessages((prev) => [...prev, payload.new]); 
          }
        } else if (payload.eventType === "DELETE") {
          // HAPUS PESAN DARI LIST LOKAL SAAT ADA YANG HAPUS DI DATABASE
          setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [myName, partnerName]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault(); if (!newMessage.trim()) return;
    await supabase.from("private_chat").insert([{ sender: myName, recipient: partnerName, message: newMessage }]);
    await supabase.from("notifications").insert([{ recipient: partnerName, sender: myName, type: "message", message: `mengirim pesan: "${newMessage.substring(0, 15)}..."` }]);
    setNewMessage("");
  };

  // FUNGSI HAPUS PESAN
  const handleDeleteMessage = async (msgId) => {
    if (confirm("Hapus pesan ini?")) {
      await supabase.from("private_chat").delete().eq("id", msgId);
      // State lokal akan otomatis update lewat realtime listener 'DELETE' di atas
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-right duration-300 relative">
      <audio ref={remoteVideoRef} autoPlay /> 
      {callStatus !== "idle" && (
        <div className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
          <div className="mb-6 relative"><div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-30 animate-pulse"></div><img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${partnerName}&radius=50`} className="w-32 h-32 rounded-full border-4 border-white/20 shadow-2xl relative z-10"/></div>
          <h2 className="text-2xl font-bold mb-2">@{partnerName}</h2>
          <p className="text-green-300 font-mono mb-10 text-lg animate-pulse">{callStatus === "calling" && "Memanggil..."}{callStatus === "incoming" && "📞 Memanggil Anda..."}{callStatus === "connected" && <span className="text-white font-bold text-3xl">{formatTime(callDuration)}</span>}</p>
          <div className="flex items-center gap-6">
            {callStatus === "incoming" ? (
              <><button onClick={() => endCall(true)} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-2xl shadow-lg transition transform hover:scale-110">⛔</button><div className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-2xl shadow-lg transition transform hover:scale-110 animate-bounce"><button onClick={answerCall} className="w-full h-full flex items-center justify-center">📞</button></div></>
            ) : (
              <>{callStatus === "connected" && (<button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg transition ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700/50 text-white hover:bg-gray-700'}`}>{isMuted ? '🔇' : '🎤'}</button>)}<button onClick={() => endCall(true)} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-3xl shadow-lg transition transform hover:scale-110">📞</button></>
            )}
          </div>
        </div>
      )}

      <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-green-600 transition">⬅</button>
          <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${partnerName}&radius=50`} className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200"/>
          <div>
            <h2 className="font-bold text-gray-800 text-sm">@{partnerName}</h2>
            {isPartnerOnline ? <span className="text-[10px] text-green-500 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>Online</span> : <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300"></span>Offline</span>}
          </div>
        </div>
        <button onClick={startCall} disabled={callStatus !== "idle"} className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition shadow-sm" title="Telepon Suara">📞</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => {
          const isMe = msg.sender === myName;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} group/msg`}>
              <div className="flex items-center gap-2">
                 {/* TOMBOL HAPUS (HANYA MUNCUL DI PESAN SENDIRI) */}
                 {isMe && (
                   <button 
                     onClick={() => handleDeleteMessage(msg.id)} 
                     className="text-[10px] text-gray-300 hover:text-red-500 opacity-0 group-hover/msg:opacity-100 transition"
                     title="Hapus Pesan"
                   >
                     🗑️
                   </button>
                 )}
                 <div className={`p-3 rounded-2xl text-sm shadow-sm max-w-[75%] ${isMe ? "bg-green-600 text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"}`}>{msg.message}</div>
              </div>
              <span className="text-[9px] text-gray-400 mt-1 font-medium mx-1"><TimeAgo timestamp={msg.created_at} /></span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input type="text" className="flex-1 p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition" placeholder={`Kirim pesan ke @${partnerName}...`} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button disabled={!newMessage.trim()} className="bg-green-600 text-white px-4 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50">➤</button>
      </form>
    </div>
  );
}