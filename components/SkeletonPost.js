export default function SkeletonPost() {
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-4 animate-pulse">
      
      {/* Header: Avatar Bulat & Nama */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div> {/* Avatar Placeholder */}
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div> {/* Nama Placeholder */}
          <div className="h-2 bg-gray-200 rounded w-1/6"></div>   {/* Waktu Placeholder */}
        </div>
      </div>

      {/* Body: Garis-garis Text */}
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>

      {/* Footer: Tombol Like/Comment */}
      <div className="flex gap-3 pt-3 border-t border-gray-50">
        <div className="h-6 bg-gray-200 rounded-full w-16"></div> {/* Tombol Like */}
        <div className="h-6 bg-gray-200 rounded-full w-20"></div> {/* Tombol Komen */}
      </div>

    </div>
  );
}