import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import { Transition } from '@headlessui/react';
import { fetchAds, addAd, updateAd, deleteAd } from '../redux/slices/adsSlice';

const Ads = () => {
  const dispatch = useDispatch();
  const { ads, loading, error } = useSelector((state) => state.ads);

  const [showForm, setShowForm] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const adsPerPage = 5;

  useEffect(() => {
    dispatch(fetchAds());
  }, [dispatch]);

  const formik = useFormik({
    initialValues: {
      image: currentAd ? currentAd.image : '',
      title: currentAd ? currentAd.title : '',
      subtitle: currentAd ? currentAd.subtitle : '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      image: Yup.string().required('Image URL is required'),
      title: Yup.string().required('Title is required'),
      subtitle: Yup.string().required('Subtitle is required'),
    }),
    onSubmit: async (values) => {
      if (currentAd) {
        try {
          await dispatch(updateAd({ id: currentAd._id, adData: values })).unwrap();
          setShowForm(false);
          setCurrentAd(null);
          formik.resetForm();
          setCurrentPage(1);
        } catch (err) {
          console.error('Update ad error:', err);
        }
      } else {
        try {
          await dispatch(addAd(values)).unwrap();
          setShowForm(false);
          formik.resetForm();
          setCurrentPage(1);
        } catch (err) {
          console.error('Add ad error:', err);
        }
      }
    },
  });

  const handleEdit = (ad) => {
    setCurrentAd(ad);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      try {
        await dispatch(deleteAd(id)).unwrap();
      } catch (err) {
        console.error('Delete ad error:', err);
      }
    }
  };

  // Pagination
  const indexOfLast = currentPage * adsPerPage;
  const indexOfFirst = indexOfLast - adsPerPage;
  const currentAds = ads.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(ads.length / adsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        Ads Management
      </h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        onClick={() => {
          setShowForm(true);
          setCurrentAd(null);
          formik.resetForm();
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition mb-6 flex items-center"
        aria-label="Add Ad"
      >
        <FaPlus className="mr-2" />
        Add Ad
      </button>

      {loading ? (
        <div className="text-gray-800 dark:text-gray-200">Loading...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Subtitle
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentAds.map((ad) => (
                  <tr key={ad._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-4 px-6 text-sm text-gray-800 dark:text-gray-200">
                      <img src={ad.image} alt={ad.title} className="w-20 h-auto rounded"/>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-800 dark:text-gray-200">
                      {ad.title}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-800 dark:text-gray-200">
                      {ad.subtitle}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-800 dark:text-gray-200 flex items-center">
                      <button
                        onClick={() => handleEdit(ad)}
                        className="text-blue-500 hover:text-blue-700 mr-4 flex items-center"
                        aria-label={`Edit ad ${ad.title}`}
                      >
                        <FaEdit className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ad._id)}
                        className="text-red-500 hover:text-red-700 flex items-center"
                        aria-label={`Delete ad ${ad.title}`}
                      >
                        <FaTrash className="mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {currentAds.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">
                      No ads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {ads.length > adsPerPage && (
            <div className="flex justify-center mt-6">
              <nav aria-label="Page navigation">
                <ul className="inline-flex -space-x-px">
                  <li>
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 ml-0 leading-tight text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-l-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                      aria-label="Previous Page"
                    >
                      <FaChevronLeft />
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => (
                    <li key={index + 1}>
                      <button
                        onClick={() => paginate(index + 1)}
                        className={`px-3 py-2 leading-tight border border-gray-300 dark:border-gray-700 ${
                          currentPage === index + 1
                            ? 'text-blue-600 bg-blue-50 dark:bg-gray-700 dark:text-white'
                            : 'text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        aria-label={`Go to page ${index + 1}`}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 leading-tight text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-r-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        currentPage === totalPages
                          ? 'cursor-not-allowed opacity-50'
                          : ''
                      }`}
                      aria-label="Next Page"
                    >
                      <FaChevronRight />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}

      <Transition
        show={showForm}
        enter="transition ease-out duration-300 transform"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-200 transform"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md mx-4 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              {currentAd ? 'Edit Ad' : 'Add New Ad'}
            </h3>
            <form onSubmit={formik.handleSubmit}>
              {/* Image URL */}
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200">
                  Image URL
                </label>
                <input
                  type="text"
                  name="image"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring border-gray-300 focus:ring-blue-200 dark:border-gray-700 dark:focus:ring-blue-500"
                  value={formik.values.image}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="https://example.com/ad.png"
                />
                {formik.touched.image && formik.errors.image && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.image}
                  </div>
                )}
              </div>
              {/* Title */}
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring border-gray-300 focus:ring-blue-200 dark:border-gray-700 dark:focus:ring-blue-500"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Ad Title"
                />
                {formik.touched.title && formik.errors.title && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.title}
                  </div>
                )}
              </div>
              {/* Subtitle */}
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200">
                  Subtitle
                </label>
                <input
                  type="text"
                  name="subtitle"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring border-gray-300 focus:ring-blue-200 dark:border-gray-700 dark:focus:ring-blue-500"
                  value={formik.values.subtitle}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Ad Subtitle"
                />
                {formik.touched.subtitle && formik.errors.subtitle && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.subtitle}
                  </div>
                )}
              </div>
              {/* Form Buttons */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setCurrentAd(null);
                    formik.resetForm();
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                  {currentAd ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default Ads;
