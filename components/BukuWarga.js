"use client";
export default function FriendList({ myName, onlineUsers, onSelectUser }) {
  const friends = [
    "waliizdihar",
    "awokawok",
    "jirooo",
    "superadmin",
    "ubud123",
    "test",
  ];
  const filteredFriends = friends.filter((f) => f !== myName);
  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-4">📒 Buku Warga</h3>
      <div className="space-y-3">
        {filteredFriends.map((friend) => (
          <div
            key={friend}
            onClick={() => onSelectUser(friend)}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer"
          >
            <img
              src={`https://api.dicebear.com/9.x/notionists/svg?seed=${friend}`}
              className="w-8 h-8 rounded-full bg-gray-100"
            />
            <p className="text-sm font-bold text-gray-700">@{friend}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
