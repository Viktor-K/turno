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

const TeamSidebar = ({ teamMembers, onMemberClick }) => {
  return (
    <aside className="bg-white rounded-lg shadow-md p-4 h-fit sticky top-4">
      <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">
        Team
      </h3>
      <ul className="space-y-2">
        {teamMembers.map((member) => (
          <li
            key={member.id}
            onClick={() => onMemberClick && onMemberClick(member)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-all duration-200 group hover:shadow-md hover:-translate-y-0.5"
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
            {/* Color dot indicator */}
            <div className={`w-3 h-3 rounded-full ${member.color.split(' ')[0]} opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-200`} />
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-400 mt-4 text-center">
        Clicca per modificare
      </p>
    </aside>
  );
};

export default TeamSidebar;
