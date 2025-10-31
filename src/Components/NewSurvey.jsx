import React, { useState } from 'react';
import { db } from '../Firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import TranslatedText from './TranslatedText';
import { FiUser, FiHash, FiFileText, FiMapPin, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const NewSurvey = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    serialNumber: '',
    name: '',
    voterId: '',
    age: '',
    gender: '',
    boothNumber: '',
    pollingAddress: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate form data
      if (!formData.serialNumber || !formData.name || !formData.voterId) {
        throw new Error('Please fill in all required fields');
      }

      // Add voter to Firestore
      const voterData = {
        ...formData,
        age: parseInt(formData.age) || 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'voters'), voterData);
      setSuccess(true);
      setFormData({
        serialNumber: '',
        name: '',
        voterId: '',
        age: '',
        gender: '',
        boothNumber: '',
        pollingAddress: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <TranslatedText>New Voter Survey</TranslatedText>
          </h1>
          <p className="text-gray-600">
            <TranslatedText>Add new voter details to the system</TranslatedText>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8">
          {/* Status Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <FiAlertCircle className="text-red-500 w-5 h-5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <FiCheckCircle className="text-green-500 w-5 h-5" />
              <p className="text-green-700 text-sm">
                <TranslatedText>Voter information saved successfully!</TranslatedText>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Serial Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TranslatedText>Serial Number</TranslatedText> *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiHash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="Enter serial number"
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TranslatedText>Name</TranslatedText> *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="Enter voter name"
                />
              </div>
            </div>

            {/* Voter ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TranslatedText>Voter ID</TranslatedText> *
              </label>
              <input
                type="text"
                name="voterId"
                value={formData.voterId}
                onChange={handleChange}
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                placeholder="Enter voter ID"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TranslatedText>Age</TranslatedText>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="18"
                max="120"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                placeholder="Enter age"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TranslatedText>Gender</TranslatedText>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
              >
                <option value=""><TranslatedText>Select gender</TranslatedText></option>
                <option value="male"><TranslatedText>Male</TranslatedText></option>
                <option value="female"><TranslatedText>Female</TranslatedText></option>
                <option value="other"><TranslatedText>Other</TranslatedText></option>
              </select>
            </div>

            {/* Booth Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TranslatedText>Booth Number</TranslatedText>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="boothNumber"
                  value={formData.boothNumber}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="Enter booth number"
                />
              </div>
            </div>
          </div>

          {/* Polling Address - Full Width */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TranslatedText>Polling Station Address</TranslatedText>
            </label>
            <textarea
              name="pollingAddress"
              value={formData.pollingAddress}
              onChange={handleChange}
              rows={3}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
              placeholder="Enter polling station address"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200
                ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-600'}
              `}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <TranslatedText>Saving...</TranslatedText>
                </div>
              ) : (
                <TranslatedText>Save Voter Information</TranslatedText>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSurvey;