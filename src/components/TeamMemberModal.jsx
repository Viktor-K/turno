import { useState, useEffect } from 'react';
import { COLOR_OPTIONS } from '../hooks/useTeamMembers';

// Avatar photo mapping
const AVATAR_PHOTOS = {
  'Gabriela': '/avatars/gabriela.jpg',
  'Usfar': '/avatars/usfar.jpeg',
  'Fabio': '/avatars/fabio.png',
  'Elisa': '/avatars/elisa.jpeg',
  'Marina': '/avatars/marina.jpeg',
  'Stefania': '/avatars/stefania.jpg',
  'Virginia': '/avatars/virginia.jpg',
  'Silvia': '/avatars/silvia.jpg'
};

const getInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0) : '';
  const last = lastName ? lastName.charAt(0) : '';
  return (first + last).toUpperCase() || '??';
};

const TeamMemberModal = ({ isOpen, onClose, member, onUpdate }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    color: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        color: member.color || ''
      });
      setHasChanges(false);
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(member.id, formData);
    setHasChanges(false);
    onClose();
  };

  const handleCancel = () => {
    setHasChanges(false);
    onClose();
  };

  const avatarPhoto = AVATAR_PHOTOS[member.firstName];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <h2 className="text-xl font-bold">Profilo Membro</h2>
              <p className="text-sm text-slate-300">Modifica informazioni</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            {avatarPhoto ? (
              <img
                src={avatarPhoto}
                alt={member.firstName}
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
              />
            ) : (
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-gray-200 shadow-lg ${formData.color}`}
              >
                {getInitials(formData.firstName, formData.lastName)}
              </div>
            )}
            <div className="mt-3 text-center">
              <p className="text-lg font-semibold text-gray-700">
                {formData.firstName} {formData.lastName}
              </p>
              {formData.email && (
                <p className="text-sm text-gray-500">{formData.email}</p>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Inserisci nome"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cognome
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Inserisci cognome"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="nome@esempio.com"
              />
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colore identificativo
              </label>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_OPTIONS.map((colorOption) => (
                  <button
                    key={colorOption.id}
                    onClick={() => handleChange('color', colorOption.classes)}
                    className={`w-10 h-10 rounded-lg ${colorOption.preview} cursor-pointer transition-all hover:scale-110 ${
                      formData.color === colorOption.classes
                        ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                        : ''
                    }`}
                    title={colorOption.label}
                  />
                ))}
              </div>
              {/* Preview */}
              <div className="mt-3">
                <span className="text-xs text-gray-500 mr-2">Anteprima:</span>
                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium border ${formData.color}`}>
                  {formData.firstName || 'Nome'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between flex-shrink-0">
          <button
            onClick={handleCancel}
            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium cursor-pointer"
          >
            {hasChanges ? 'Annulla' : 'Chiudi'}
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer"
            >
              Salva modifiche
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamMemberModal;
