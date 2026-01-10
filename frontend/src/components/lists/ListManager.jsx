import { useState } from 'react';
import { LIST_TYPES, LIST_TYPE_LABELS } from '../../utils/constants';
import RatingInput from '../movies/RatingInput';

const ListManager = ({ movie, onAddToList, existingEntries = [] }) => {
  const [selectedList, setSelectedList] = useState('');
  const [rating, setRating] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [dateWatched, setDateWatched] = useState('');

  const handleAdd = () => {
    if (!selectedList) {
      alert('Please select a list');
      return;
    }

    const entry = {
      movieId: movie._id,
      tmdbId: movie.tmdbId,
      listType: selectedList,
      ratingInteger: rating || undefined,
      reviewText: reviewText.trim() || undefined,
      dateWatched: dateWatched || undefined
    };

    onAddToList(entry);
    
    // Reset form
    setSelectedList('');
    setRating('');
    setReviewText('');
    setDateWatched('');
  };

  const existingInList = (listType) => {
    return existingEntries.find(entry => entry.listType === listType);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Add to List</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select List
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(LIST_TYPES).map((type) => {
              const exists = existingInList(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => !exists && setSelectedList(type)}
                  disabled={!!exists}
                  className={`px-4 py-2 rounded-lg transition ${
                    selectedList === type
                      ? 'bg-primary-600 text-white'
                      : exists
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {LIST_TYPE_LABELS[type]}
                  {exists && ' ✓'}
                </button>
              );
            })}
          </div>
        </div>

        {selectedList && (
          <>
            <RatingInput
              rating={rating}
              onChange={(ratings) => {
                setRating(ratings.rating);
              }}
            />

            {selectedList === LIST_TYPES.WATCHED && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Watched Date
                </label>
                <input
                  type="date"
                  value={dateWatched}
                  onChange={(e) => setDateWatched(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows="3"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="Add your thoughts..."
              />
            </div>

            <button
              onClick={handleAdd}
              className="w-full bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Add to {LIST_TYPE_LABELS[selectedList]}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ListManager;
