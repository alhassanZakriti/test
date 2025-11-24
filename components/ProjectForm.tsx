'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiUpload, FiMic, FiFileText, FiX, FiImage } from 'react-icons/fi';
import VoiceRecorder from './VoiceRecorder';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProjectForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    phoneNumber: '',
    textInput: '',
    logoUrl: '', // Will store base64 encoded logo
    photoUrls: [] as string[], // Will store base64 encoded images
    voiceMemoUrl: '', // Will store base64 encoded audio
  });

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 2 * 1024 * 1024; // 2MB

    if (file.size > maxSize) {
      alert(`${file.name} ${t('projectForm.fileTooLarge')}`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert(`${file.name} ${t('projectForm.notAnImage')}`);
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setFormData({ ...formData, logoUrl: base64 });
    } catch (error) {
      console.error('Error converting logo:', error);
      alert(t('projectForm.uploadError'));
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxFiles = 5;
    const maxSize = 4 * 1024 * 1024; // 4MB

    const fileArray = Array.from(files).slice(0, maxFiles);
    const base64Images: string[] = [];

    for (const file of fileArray) {
      if (file.size > maxSize) {
        alert(`${file.name} ${t('projectForm.fileTooLarge')}`);
        continue;
      }

      if (!file.type.startsWith('image/')) {
        alert(`${file.name} ${t('projectForm.notAnImage')}`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        base64Images.push(base64);
      } catch (error) {
        console.error('Error converting image:', error);
      }
    }

    setFormData({
      ...formData,
      photoUrls: [...formData.photoUrls, ...base64Images],
    });
  };

  // Handle audio upload
  const handleAudioUpload = async (file: File) => {
    const maxSize = 8 * 1024 * 1024; // 8MB

    if (file.size > maxSize) {
      alert(t('projectForm.audioTooLarge'));
      return;
    }

    if (!file.type.startsWith('audio/')) {
      alert(t('projectForm.onlyAudio'));
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setFormData({ ...formData, voiceMemoUrl: base64 });
    } catch (error) {
      console.error('Error converting audio:', error);
      alert(t('projectForm.uploadError'));
    }
  };

  // Handle recording complete
  const handleRecordingComplete = async (audioBlob: Blob) => {
    try {
      const file = new File([audioBlob], 'voice-memo.webm', { type: 'audio/webm' });
      const base64 = await fileToBase64(file);
      setFormData({ ...formData, voiceMemoUrl: base64 });
    } catch (error) {
      console.error('Error converting recording:', error);
      alert(t('projectForm.recordingError'));
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, textInput: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Show AI preview simulation
    setShowAIPreview(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title || 'Nieuw Project',
          phoneNumber: formData.phoneNumber,
          textInput: formData.textInput,
          logoUrl: formData.logoUrl,
          photoUrls: formData.photoUrls,
          voiceMemoUrl: formData.voiceMemoUrl,
          description: formData.textInput,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const data = await response.json();
      
      // Close preview and redirect
      setTimeout(() => {
        setShowAIPreview(false);
        router.push('/dashboard');
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error('Error creating project:', error);
      setIsLoading(false);
      setShowAIPreview(false);
      alert(t('projectForm.submitError'));
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...formData.photoUrls];
    newPhotos.splice(index, 1);
    setFormData({ ...formData, photoUrls: newPhotos });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('projectForm.projectTitleOptional')}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-modual-purple dark:focus:ring-modual-pink focus:border-transparent"
              placeholder={t('projectForm.projectTitlePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('projectForm.phoneNumber')} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-modual-purple dark:focus:ring-modual-pink focus:border-transparent"
              placeholder={t('projectForm.phoneNumberPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiFileText className="inline mr-2" />
              {t('projectForm.describeWebsite')}
            </label>
            <textarea
              value={formData.textInput}
              onChange={handleTextChange}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-modual-purple dark:focus:ring-modual-pink focus:border-transparent"
              placeholder={t('projectForm.descriptionPlaceholder')}
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('projectForm.detailsHelp')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiImage className="inline mr-2" />
              {t('projectForm.uploadLogo')}
            </label>
            <div className="space-y-4">
              {formData.logoUrl && (
                <div className="flex items-center justify-center">
                  <div className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="h-32 w-auto object-contain rounded-lg border-2 border-gray-200 dark:border-gray-600 p-4 bg-white dark:bg-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: '' })}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-modual-purple dark:hover:border-modual-pink transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer inline-flex items-center space-x-2 bg-gradient-modual text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <FiUpload />
                  <span>{t('projectForm.uploadLogoButton')}</span>
                </label>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('projectForm.maxLogo')}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiImage className="inline mr-2" />
              {t('projectForm.uploadPhotosOptional')}
            </label>
            <div className="space-y-4">
              {formData.photoUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.photoUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-modual-purple dark:hover:border-modual-pink transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer inline-flex items-center space-x-2 bg-gradient-modual text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <FiUpload />
                  <span>{t('projectForm.uploadImages')}</span>
                </label>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('projectForm.maxImages')}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiMic className="inline mr-2" />
              {t('projectForm.recordVoiceOptional')}
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-modual-purple dark:hover:border-modual-pink transition-colors">
              {formData.voiceMemoUrl ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('projectForm.audioReady')}</p>
                    <audio controls src={formData.voiceMemoUrl} className="w-full" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, voiceMemoUrl: '' })}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium flex items-center space-x-1 mx-auto"
                  >
                    <FiX />
                    <span>{t('projectForm.removeRecording')}</span>
                  </button>
                </div>
              ) : (
                <VoiceRecorder 
                  onRecordingComplete={handleRecordingComplete}
                  onUpload={handleAudioUpload}
                />
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('projectForm.voiceInstructions')}
            </p>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isLoading || !formData.phoneNumber || (!formData.textInput && !formData.logoUrl && formData.photoUrls.length === 0 && !formData.voiceMemoUrl)}
              className="w-full bg-gradient-modual text-white py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('projectForm.processing') : t('projectForm.submitRequest')}
            </button>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('projectForm.fillOneField')}
            </p>
          </div>
        </div>
      </form>

      {/* AI Preview Modal */}
      {showAIPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center"
          >
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-modual rounded-full mx-auto flex items-center justify-center mb-4 animate-pulse">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold gradient-text mb-2">
                {t('projectForm.aiPreviewTitle')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('projectForm.aiAnalyzing')}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-modual-purple"></div>
                <span className="text-gray-700 dark:text-gray-300">{t('projectForm.analyzingText')}</span>
              </div>
              {formData.photoUrls.length > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-modual-pink"></div>
                  <span className="text-gray-700 dark:text-gray-300">{t('projectForm.processingImages')}</span>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-modual-blue"></div>
                <span className="text-gray-700 dark:text-gray-300">{t('projectForm.generatingDesign')}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
              <p className="text-green-800 dark:text-green-300 font-medium">
                ✓ {t('projectForm.requestReceived')}
              </p>
              <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                {t('projectForm.willContactSoon')}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

