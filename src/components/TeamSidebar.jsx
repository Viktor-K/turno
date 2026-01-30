import { useState } from 'react';

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
  const last = lastName ? lastName.charAt(0) : firstName ? firstName.charAt(1) : '';
  return (first + last).toUpperCase() || '??';
};

const TeamSidebar = ({ teamMembers, onMemberClick, onAddMember, onDeleteMember }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (newMemberName.trim()) {
      onAddMember({ firstName: newMemberName.trim() });
      setNewMemberName('');
      setShowAddForm(false);
    }
  };

  const handleDeleteClick = (e, member) => {
    e.stopPropagation();
    setConfirmDelete(member.id);
  };

  const handleConfirmDelete = (e, memberId) => {
    e.stopPropagation();
    onDeleteMember(memberId);
    setConfirmDelete(null);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setConfirmDelete(null);
  };

  return (
    <aside className="bg-white rounded-lg shadow-md p-4 h-fit sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Team
        </h3>
        <span className="text-xs text-gray-400">{teamMembers.length} membri</span>
      </div>

      <ul className="space-y-2">
        {teamMembers.map((member) => (
          <li
            key={member.id}
            onClick={() => onMemberClick && onMemberClick(member)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-all duration-200 group hover:shadow-md hover:-translate-y-0.5 relative"
          >
            {/* Avatar with photo */}
            {AVATAR_PHOTOS[member.firstName] ? (
              <img
                src={AVATAR_PHOTOS[member.firstName]}
                alt={member.firstName}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-400 group-hover:scale-110 group-hover:shadow-lg transition-all duration-200"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${member.color} group-hover:scale-110 group-hover:shadow-lg transition-all duration-200`}
              >
                {getInitials(member.firstName, member.lastName)}
              </div>
            )}

            {/* Name and color indicator */}
            <div className="flex-1 min-w-0">
              <span className="text-gray-700 font-medium block truncate group-hover:text-blue-600 transition-colors duration-200">
                {member.firstName} {member.lastName}
              </span>
              {member.email && (
                <span className="text-xs text-gray-400 block truncate group-hover:text-blue-400 transition-colors duration-200">{member.email}</span>
              )}
            </div>

            {/* Delete confirmation or delete button */}
            {confirmDelete === member.id ? (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={(e) => handleConfirmDelete(e, member.id)}
                  className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                  title="Conferma eliminazione"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                  title="Annulla"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                {/* Color dot indicator */}
                <div className={`w-3 h-3 rounded-full ${member.color.split(' ')[0]} opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-200`} />

                {/* Delete button (shown on hover) */}
                {onDeleteMember && (
                  <button
                    onClick={(e) => handleDeleteClick(e, member)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Elimina membro"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      {/* Add member form or button */}
      {showAddForm ? (
        <form onSubmit={handleAddSubmit} className="mt-4 space-y-2">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="Nome del membro"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Aggiungi
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewMemberName('');
              }}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annulla
            </button>
          </div>
        </form>
      ) : (
        onAddMember && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mt-4 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Aggiungi membro
          </button>
        )
      )}

      <p className="text-xs text-gray-400 mt-4 text-center">
        Clicca per modificare
      </p>
    </aside>
  );
};

export default TeamSidebar;
