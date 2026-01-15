import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { journalsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const WriteJournal = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const quillRef = useRef(null);
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const toolbarModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'bullet' }, { list: 'ordered' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: () => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            await handleUploadAndInsert(file);
          };
        }
      }
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image'
  ];

  const handleUploadAndInsert = async (file) => {
    setUploading(true);
    try {
      const res = await journalsAPI.uploadJournalImage(file);
      const url = res.data.data.url;

      // store for gallery as well
      setImageUrls((prev) => [...prev, url]);

      // insert into editor
      const quill = quillRef.current?.getEditor?.();
      if (!quill) return;
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', url);
      quill.setSelection(range.index + 1);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    for (const file of files) {
      // upload but don't auto-insert; user can insert via toolbar too
      setUploading(true);
      try {
        const res = await journalsAPI.uploadJournalImage(file);
        const url = res.data.data.url;
        setImageUrls((prev) => [...prev, url]);
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
    e.target.value = '';
  };

  const removeImage = (url) => setImageUrls((prev) => prev.filter((u) => u !== url));

  const uniqueUrls = (urls) => {
    const seen = new Set();
    return urls.filter((u) => {
      if (!u || typeof u !== 'string') return false;
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    });
  };

  const extractAndRemoveImagesFromHtml = (html) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const imgs = Array.from(doc.querySelectorAll('img'));
      const srcs = imgs.map((img) => img.getAttribute('src')).filter(Boolean);
      imgs.forEach((img) => img.remove());
      return { cleanedHtml: doc.body.innerHTML, extractedUrls: srcs };
    } catch {
      return { cleanedHtml: html, extractedUrls: [] };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!title.trim()) {
      alert('Title is required');
      return;
    }
    if (!contentHtml || !contentHtml.trim() || contentHtml === '<p><br></p>') {
      alert('Description is required');
      return;
    }

    setSubmitting(true);
    try {
      // Make published journals look like your sample:
      // images are stored separately and rendered as a cover/gallery, not inline inside the text.
      const { cleanedHtml, extractedUrls } = extractAndRemoveImagesFromHtml(contentHtml);
      const mergedImageUrls = uniqueUrls([...imageUrls, ...extractedUrls]);

      await journalsAPI.create({
        title: title.trim(),
        contentHtml: cleanedHtml,
        imageUrls: mergedImageUrls
      });
      navigate('/journal');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to publish journal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Write your journal</h1>
            <p className="text-gray-400">Share your thoughts with the community.</p>
          </div>
          <button
            onClick={() => navigate('/journal')}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-gray-800 rounded-lg p-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter journal title..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              maxLength={200}
              required
            />
          </div>

          <div className="bg-gray-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Description
              </label>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-300 cursor-pointer hover:text-white transition">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAddImages}
                    disabled={uploading}
                  />
                  {uploading ? 'Uploading…' : 'Add images'}
                </label>
              </div>
            </div>

            <div className="journal-editor rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={contentHtml}
                onChange={setContentHtml}
                modules={toolbarModules}
                formats={formats}
                placeholder="Write your journal..."
              />
            </div>

            {imageUrls.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Uploaded images</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imageUrls.map((url) => (
                    <div key={url} className="relative rounded-lg overflow-hidden bg-gray-700">
                      <img
                        src={url}
                        alt="Journal upload"
                        className="w-full h-28 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Tip: Use the image button in the toolbar to insert an uploaded image into the editor.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/journal')}
              className="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {submitting ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteJournal;

