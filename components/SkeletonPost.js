export default function SkeletonPost() {
  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 mb-4 animate-pulse">
      <div className="flex gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div> {/* Avatar */}
        <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/3"></div> {/* Nama */}
            <div className="h-2 bg-gray-200 rounded w-1/4"></div> {/* Waktu */}
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full"></div> {/* Konten Baris 1 */}
        <div className="h-3 bg-gray-200 rounded w-5/6"></div> {/* Konten Baris 2 */}
        <div className="h-3 bg-gray-200 rounded w-4/6"></div> {/* Konten Baris 3 */}
      </div>
    </div>
  );
}