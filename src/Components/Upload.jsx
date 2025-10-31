import React, { useState, useRef } from "react";
import { parseExcelFile } from "../utils/excelParser";
import { db } from "../Firebase/config";
import { collection, writeBatch, doc } from "firebase/firestore";
import { UploadIcon } from "lucide-react";
import TranslatedText from "./TranslatedText";
import useAutoTranslate from "../hooks/useAutoTranslate.jsx";

const Upload = ({ onUploadComplete = () => {} }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { currentLanguage } = useAutoTranslate();

  const handleFileUpload = async (file) => {
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setProgress(0);

    try {
      const voterData = await parseExcelFile(file);
      const totalVoters = voterData.length;
      const batchSize = 1000; // optimize batch for Firestore
      let processed = 0;

      const votersCollection = collection(db, "voters");

      for (let i = 0; i < totalVoters; i += batchSize) {
        const batch = writeBatch(db);
        const slice = voterData.slice(i, i + batchSize);

        slice.forEach((voter) => {
          const newDocRef = doc(votersCollection);
          batch.set(newDocRef, voter);
        });

        await batch.commit();
        processed += slice.length;

        setProgress(Math.min((processed / totalVoters) * 100, 100));

        // prevent blocking UI
        await new Promise((r) => setTimeout(r, 50));
      }

      onUploadComplete(totalVoters);
      setUploading(false);
      setProgress(0);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading file. Please check your Excel format.");
      setUploading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
  };

  const handleClick = () => {
    if (!uploading && fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl p-6 sm:p-8 border border-white/50">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UploadIcon className="text-orange-500 font-bold" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              <TranslatedText>Upload Voter Data</TranslatedText>
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              <TranslatedText>Upload Excel files with voter information</TranslatedText>
            </p>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-300 cursor-pointer ${
              dragActive
                ? "border-orange-500 bg-orange-50/50 scale-[1.02]"
                : uploading
                ? "border-gray-300 bg-gray-50/50 cursor-not-allowed"
                : "border-orange-300 bg-white/50 hover:border-orange-400 hover:bg-orange-50/30 hover:scale-[1.01]"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <div className="space-y-4">
              <div className={`w-12 h-12 mx-auto transition-colors ${
                uploading ? "text-gray-400" : "text-orange-500"
              }`}>
                {uploading ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                ) : (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
              </div>
              <div className="space-y-2">
                <p className={`font-medium ${uploading ? "text-gray-600" : "text-gray-800"}`}>
                  {uploading ? (
                    <TranslatedText>Uploading your file...</TranslatedText>
                  ) : (
                    <>
                      <span className="text-orange-600 hover:text-orange-700 underline">
                        <TranslatedText>Click to upload</TranslatedText>
                      </span>{" "}
                      <TranslatedText>or drag and drop</TranslatedText>
                    </>
                  )}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {uploading ? fileName : <TranslatedText>Excel files (.xlsx, .xls, .csv)</TranslatedText>}
                </p>
              </div>
            </div>
          </div>

          {uploading && (
            <div className="mt-6 space-y-3 animate-fade-in">
              <div className="flex justify-between text-sm text-gray-600">
                <span className="truncate flex-1 mr-2">{fileName}</span>
                <span className="font-medium text-orange-600 whitespace-nowrap">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                <TranslatedText>Processing data... Please don't close this window</TranslatedText>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;
