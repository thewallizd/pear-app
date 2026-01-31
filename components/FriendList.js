"use client";
import { useState } from "react";

export default function FriendList({ myName, onlineUsers, onSelectUser }) {
  // Data Dummy Teman (Nanti bisa diganti database)
  const friends = [
    "waliizdihar", "awokawok", "jirooo", "superadmin", "ubud123", "test", 
    "gery", "apel", "lerep", "bombom"
  ];

  // Filter: Jangan tampilkan diri sendiri
  const filteredFriends = friends.filter(f => f !== myName);

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm animate-in fade-in">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>📒</span> Buku Warga
      </h3>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
        {filteredFriends.map((friend) => {
            const isOnline = onlineUsers.has(friend);
            return (
                <div 
                    key={friend} 
                    onClick={() => onSelectUser(friend)}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition group"
                >
                    <div className="relative">
                        <img 
                            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${friend}`} 
                            className="w-10 h-10 rounded-full border border-gray-100 bg-white"
                        />
                        {/* Status Dot */}
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    </div>
                    
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-700 group-hover:text-green-600 transition">@{friend}</p>
                        <p className="text-[10px] text-gray-400">
                            {isOnline ? "Sedang Online" : "Terakhir dilihat barusan"}
                        </p>
                    </div>

                    <button className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full group-hover:bg-green-500 group-hover:text-white transition">
                        Chat
                    </button>
                </div>
            );
        })}
      </div>
    </div>
  );
}