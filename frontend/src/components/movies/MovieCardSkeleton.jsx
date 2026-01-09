const MovieCardSkeleton = () => {
  return (
    <div className="flex-shrink-0 w-44 md:w-52 animate-pulse">
      <div className="relative">
        {/* Poster Skeleton */}
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-800 mb-2">
          <div className="w-full h-full bg-gray-700"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="flex items-center justify-between text-xs mt-2 px-1">
          <div className="flex items-center space-x-1">
            <div className="w-3.5 h-3.5 bg-gray-700 rounded"></div>
            <div className="w-8 h-3 bg-gray-700 rounded"></div>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3.5 h-3.5 bg-gray-700 rounded"></div>
            <div className="w-8 h-3 bg-gray-700 rounded"></div>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3.5 h-3.5 bg-gray-700 rounded"></div>
            <div className="w-8 h-3 bg-gray-700 rounded"></div>
          </div>
        </div>

        {/* Title Skeleton */}
        <div className="mt-2">
          <div className="h-4 bg-gray-700 rounded mb-1"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
};

export default MovieCardSkeleton;
