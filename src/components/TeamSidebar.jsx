import { TEAM_MEMBERS, MEMBER_COLORS } from '../utils/constants';

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

const getInitials = (name) => {
  return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = {
    'Gabriela': 'bg-pink-100 text-pink-600',
    'Usfar': 'bg-sky-100 text-sky-600',
    'Fabio': 'bg-emerald-100 text-emerald-600',
    'Elisa': 'bg-amber-100 text-amber-600',
    'Marina': 'bg-violet-100 text-violet-600',
    'Stefania': 'bg-rose-100 text-rose-600',
    'Virginia': 'bg-indigo-100 text-indigo-600',
    'Silvia': 'bg-cyan-100 text-cyan-600'
  };
  return colors[name] || 'bg-gray-100 text-gray-600';
};

const TeamSidebar = () => {
  return (
    <aside className="bg-white rounded-lg shadow-md p-4 h-fit sticky top-4">
      <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">
        Team
      </h3>
      <ul className="space-y-3">
        {TEAM_MEMBERS.map((member) => (
          <li key={member} className="flex items-center gap-3">
            {/* Avatar with photo */}
            {AVATAR_PHOTOS[member] ? (
              <img
                src={AVATAR_PHOTOS[member]}
                alt={member}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${getAvatarColor(member)}`}
              >
                {getInitials(member)}
              </div>
            )}
            {/* Name */}
            <span className="text-gray-700 font-medium">{member}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default TeamSidebar;
