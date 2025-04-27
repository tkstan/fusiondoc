import React, { useState, useCallback } from 'react';
import { FilePlus, FileText, File as FileIcon, Loader2, AlertTriangle, GripVertical, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock function for demonstration purposes
const mockMergeFiles = async (files, order) => {
  console.log('Merging files:', files, 'with order:', order);
  await new Promise(resolve => setTimeout(resolve, 1500));
  return new Blob(['mock merged content'], { type: 'application/octet-stream' });
};

const getFileType = (mimeType) => {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'pptx';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  return 'unknown';
};

const DownloadButton = ({ blob, filename }) => {
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  return (
    <a
      href={url}
      download={filename}
      className="text-blue-500 hover:underline"
      onClick={() => URL.revokeObjectURL(url)}
    >
      Télécharger le fichier fusionné
    </a>
  );
};

const fileItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1 },
  }),
  exit: { opacity: 0, x: 20 },
};

const MergeFilesApp = () => {
  const [files, setFiles] = useState([]);
  const [mergedBlob, setMergedBlob] = useState(null);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState(null);

  const addFiles = useCallback((newFiles) => {
    const uniqueFiles = newFiles.filter(
      (newFile) => !files.find((existingFile) => existingFile.name === newFile.name)
    );
    const newFileEntries = uniqueFiles.map((file, index) => ({
      ...file,
      order: files.length + index,
      fileType: getFileType(file.type),
    }));
    setFiles(prev => [...prev, ...newFileEntries]);
    setError(null);
  }, [files]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleInputChange = useCallback((e) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  }, [addFiles]);

  const removeFile = (fileName) => {
    setFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const handleReorder = (draggedIndex, targetIndex) => {
    if (draggedIndex === targetIndex) return;
    const updatedFiles = [...files];
    const [draggedFile] = updatedFiles.splice(draggedIndex, 1);
    updatedFiles.splice(targetIndex, 0, draggedFile);
    updatedFiles.forEach((file, idx) => file.order = idx);
    setFiles(updatedFiles);
  };

  const handleMerge = useCallback(async () => {
    if (files.length < 2) {
      setError('Veuillez sélectionner au moins deux fichiers.');
      return;
    }
    setIsMerging(true);
    setMergedBlob(null);
    setError(null);
    const orderedFiles = [...files].sort((a, b) => a.order - b.order);

    try {
      const blob = await mockMergeFiles(orderedFiles, orderedFiles.map(f => f.order));
      setMergedBlob(blob);
    } catch (err) {
      setError(`Erreur lors de la fusion des fichiers: ${err.message || 'Unknown error'}`);
    } finally {
      setIsMerging(false);
    }
  }, [files]);

  const resetInputs = () => {
    setFiles([]);
    setMergedBlob(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start py-12">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Fusionner des Fichiers</h1>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="w-full max-w-md p-6 rounded-lg border-2 border-dashed border-gray-300 text-center mb-6 cursor-pointer bg-white/5 hover:border-blue-500 transition-colors"
      >
        <FileIcon className="w-10 h-10 mx-auto mb-4 text-gray-600" />
        <p className="text-gray-600">Déposez les fichiers ici, ou cliquez pour sélectionner (PDF, PPTX, DOCX)</p>
        <input
          type="file"
          multiple
          onChange={handleInputChange}
          accept=".pdf,.pptx,.docx,.docm"
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            <FilePlus className="mr-2 h-4 w-4" />
            Choisir des fichiers
          </Button>
        </label>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="w-full max-w-md mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Fichiers sélectionnés :</h2>
          <AnimatePresence>
            <div className="space-y-2">
              {files.map((file, index) => (
                <motion.div
                  key={file.name}
                  variants={fileItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  custom={index}
                  className="flex items-center justify-between p-2 rounded-md bg-white/5 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing group"
                >
                  <GripVertical className="w-4 h-4 text-gray-400 mr-2 cursor-move group-hover:text-gray-600" />
                  <div className="flex items-center gap-2 flex-1">
                    {file.fileType === 'pdf' && <FileIcon className="w-4 h-4 text-red-500" />}
                    {file.fileType === 'pptx' && <FileIcon className="w-4 h-4 text-green-500" />}
                    {file.fileType === 'docx' && <FileText className="w-4 h-4 text-blue-500" />}
                    <span className="text-gray-700 truncate">{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.name)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      )}

      {/* Buttons */}
      <div className="mb-4">
        <Button
          onClick={handleMerge}
          disabled={isMerging || files.length < 2}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          {isMerging ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fusion des fichiers...
            </>
          ) : (
            'Fusionner les fichiers'
          )}
        </Button>
        <Button
          onClick={resetInputs}
          className="ml-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Réinitialiser
        </Button>
      </div>

      {/* Download button */}
      {mergedBlob && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">Fichier Résultat :</h2>
          <DownloadButton blob={mergedBlob} filename="merged_files.dat" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded relative" role="alert">
          <AlertTriangle className="inline mr-2 h-6 w-6" />
          <span className="font-bold">Erreur:</span>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </div>
  );
};

export default MergeFilesApp;
