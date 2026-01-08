const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
      <div className="flex items-center justify-between">
        <p>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 text-red-300 hover:text-red-100 underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
