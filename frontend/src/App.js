import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Main App Component
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [swapRequests, setSwapRequests] = useState([]);

  useEffect(() => {
    // Check if user exists in localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setCurrentView('dashboard');
    }
  }, []);

  // Components
  const Header = () => (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">SkillSwap</h1>
          <nav className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="hover:text-blue-200 transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('browse')}
                  className="hover:text-blue-200 transition"
                >
                  Browse
                </button>
                <button
                  onClick={() => setCurrentView('profile')}
                  className="hover:text-blue-200 transition"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem('currentUser');
                    setCurrentView('home');
                  }}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentView('login')}
                  className="hover:text-blue-200 transition"
                >
                  Login
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded transition"
                >
                  Sign Up
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );

  const Home = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-800 mb-6">
            Exchange Skills, Build Communities
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with people in your area to swap skills. Teach what you know, learn what you need.
          </p>
          <button
            onClick={() => setCurrentView('register')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:shadow-lg transition transform hover:scale-105"
          >
            Get Started
          </button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">List Your Skills</h3>
            <p className="text-gray-600">Share what you're good at and what you want to learn</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-purple-600 text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Find Matches</h3>
            <p className="text-gray-600">Discover people with complementary skills in your area</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-green-600 text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold mb-2">Start Swapping</h3>
            <p className="text-gray-600">Connect and exchange knowledge with your community</p>
          </div>
        </div>
      </div>
    </div>
  );

  const Register = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      location: '',
      profile_photo: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await axios.post(`${API}/users`, formData);
        setCurrentUser(response.data);
        localStorage.setItem('currentUser', JSON.stringify(response.data));
        setCurrentView('profile');
      } catch (error) {
        alert('Registration failed: ' + (error.response?.data?.detail || 'Unknown error'));
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City, State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo URL (Optional)</label>
              <input
                type="url"
                value={formData.profile_photo}
                onChange={(e) => setFormData({...formData, profile_photo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-semibold"
            >
              Create Account
            </button>
          </form>
        </div>
      </div>
    );
  };

  const Login = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!email.trim()) {
        alert('Please enter your email');
        return;
      }
      
      setLoading(true);
      try {
        const response = await axios.get(`${API}/users`);
        console.log('Users response:', response.data);
        const user = response.data.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
          console.log('User found:', user);
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          setCurrentView('dashboard');
          alert('Login successful!');
        } else {
          alert('User not found. Please check your email or create an account.');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + (error.response?.data?.detail || 'Unable to connect to server'));
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const Profile = () => {
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
      name: currentUser?.name || '',
      location: currentUser?.location || '',
      profile_photo: currentUser?.profile_photo || '',
      skills_offered: currentUser?.skills_offered || [],
      skills_wanted: currentUser?.skills_wanted || [],
      availability: currentUser?.availability || '',
      is_public: currentUser?.is_public !== false
    });
    const [newSkillOffered, setNewSkillOffered] = useState('');
    const [newSkillWanted, setNewSkillWanted] = useState('');

    const handleSave = async () => {
      try {
        const response = await axios.put(`${API}/users/${currentUser.id}`, formData);
        setCurrentUser(response.data);
        localStorage.setItem('currentUser', JSON.stringify(response.data));
        setEditMode(false);
      } catch (error) {
        alert('Update failed');
      }
    };

    const addSkillOffered = () => {
      if (newSkillOffered.trim()) {
        setFormData({
          ...formData,
          skills_offered: [...formData.skills_offered, newSkillOffered.trim()]
        });
        setNewSkillOffered('');
      }
    };

    const addSkillWanted = () => {
      if (newSkillWanted.trim()) {
        setFormData({
          ...formData,
          skills_wanted: [...formData.skills_wanted, newSkillWanted.trim()]
        });
        setNewSkillWanted('');
      }
    };

    const removeSkillOffered = (index) => {
      setFormData({
        ...formData,
        skills_offered: formData.skills_offered.filter((_, i) => i !== index)
      });
    };

    const removeSkillWanted = (index) => {
      setFormData({
        ...formData,
        skills_wanted: formData.skills_wanted.filter((_, i) => i !== index)
      });
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Profile</h2>
              <button
                onClick={() => editMode ? handleSave() : setEditMode(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                {editMode ? 'Save' : 'Edit'}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{currentUser?.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{currentUser?.location || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.availability}
                        onChange={(e) => setFormData({...formData, availability: e.target.value})}
                        placeholder="e.g., Weekends, Evenings"
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{currentUser?.availability || 'Not specified'}</p>
                    )}
                  </div>
                  {editMode && (
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_public}
                          onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                          className="mr-2"
                        />
                        Make profile public
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Skills Offered</h3>
                {editMode && (
                  <div className="flex mb-2">
                    <input
                      type="text"
                      value={newSkillOffered}
                      onChange={(e) => setNewSkillOffered(e.target.value)}
                      placeholder="Add a skill you offer"
                      className="flex-1 px-3 py-2 border rounded-l-md focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && addSkillOffered()}
                    />
                    <button
                      onClick={addSkillOffered}
                      className="bg-green-600 text-white px-3 py-2 rounded-r-md hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.skills_offered.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {skill}
                      {editMode && (
                        <button
                          onClick={() => removeSkillOffered(index)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <h3 className="text-lg font-semibold mb-4">Skills Wanted</h3>
                {editMode && (
                  <div className="flex mb-2">
                    <input
                      type="text"
                      value={newSkillWanted}
                      onChange={(e) => setNewSkillWanted(e.target.value)}
                      placeholder="Add a skill you want to learn"
                      className="flex-1 px-3 py-2 border rounded-l-md focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && addSkillWanted()}
                    />
                    <button
                      onClick={addSkillWanted}
                      className="bg-green-600 text-white px-3 py-2 rounded-r-md hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.skills_wanted.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {skill}
                      {editMode && (
                        <button
                          onClick={() => removeSkillWanted(index)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Browse = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');

    useEffect(() => {
      loadUsers();
    }, [searchTerm, locationFilter]);

    const loadUsers = async () => {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('skill', searchTerm);
        if (locationFilter) params.append('location', locationFilter);
        
        const response = await axios.get(`${API}/users?${params}`);
        setUsers(response.data.filter(u => u.id !== currentUser?.id));
      } catch (error) {
        console.error('Failed to load users');
      }
    };

    const sendSwapRequest = async (receiverId, receiverSkill, requesterSkill) => {
      try {
        await axios.post(`${API}/swap-requests?requester_id=${currentUser.id}`, {
          receiver_id: receiverId,
          receiver_skill: receiverSkill,
          requester_skill: requesterSkill,
          message: `Hi! I'd like to swap my ${requesterSkill} skills for your ${receiverSkill} expertise.`
        });
        alert('Swap request sent!');
      } catch (error) {
        alert('Failed to send request');
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Browse Skills</h2>
          
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search by Skill</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g., JavaScript, Guitar, Cooking..."
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Location</label>
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="City, State"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => (
              <div key={user.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  {user.profile_photo ? (
                    <img
                      src={user.profile_photo}
                      alt={user.name}
                      className="w-12 h-12 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">{user.name[0]}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.location}</p>
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm text-gray-600 ml-1">
                        {user.rating || 0} ({user.total_ratings || 0})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Offers:</h4>
                  <div className="flex flex-wrap gap-1">
                    {user.skills_offered.slice(0, 3).map((skill, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                    {user.skills_offered.length > 3 && (
                      <span className="text-xs text-gray-500">+{user.skills_offered.length - 3} more</span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Wants:</h4>
                  <div className="flex flex-wrap gap-1">
                    {user.skills_wanted.slice(0, 3).map((skill, index) => (
                      <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                    {user.skills_wanted.length > 3 && (
                      <span className="text-xs text-gray-500">+{user.skills_wanted.length - 3} more</span>
                    )}
                  </div>
                </div>

                {currentUser && (
                  <button
                    onClick={() => {
                      const requesterSkill = prompt(`Which of your skills would you like to offer?\n${currentUser.skills_offered.join(', ')}`);
                      const receiverSkill = prompt(`Which of ${user.name}'s skills interests you?\n${user.skills_offered.join(', ')}`);
                      if (requesterSkill && receiverSkill) {
                        sendSwapRequest(user.id, receiverSkill, requesterSkill);
                      }
                    }}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                  >
                    Send Swap Request
                  </button>
                )}
              </div>
            ))}
          </div>

          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No users found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
      loadDashboard();
    }, []);

    const loadDashboard = async () => {
      try {
        const response = await axios.get(`${API}/dashboard/${currentUser.id}`);
        setDashboardData(response.data);
      } catch (error) {
        console.error('Failed to load dashboard');
      }
    };

    const handleRequestAction = async (requestId, action) => {
      try {
        await axios.put(`${API}/swap-requests/${requestId}`, { status: action });
        loadDashboard();
      } catch (error) {
        alert('Failed to update request');
      }
    };

    const deleteRequest = async (requestId) => {
      try {
        await axios.delete(`${API}/swap-requests/${requestId}`);
        loadDashboard();
      } catch (error) {
        alert('Failed to delete request');
      }
    };

    if (!dashboardData) {
      return <div className="p-8">Loading...</div>;
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Received Requests</h3>
              {dashboardData.received_requests.length === 0 ? (
                <p className="text-gray-600">No requests received.</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.received_requests.map(request => (
                    <div key={request.id} className="border rounded p-4">
                      <p className="font-semibold">Skill Swap Request</p>
                      <p className="text-sm text-gray-600">
                        They offer: <span className="font-medium">{request.requester_skill}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        They want: <span className="font-medium">{request.receiver_skill}</span>
                      </p>
                      <p className="text-sm text-gray-600 mb-2">Status: {request.status}</p>
                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRequestAction(request.id, 'accepted')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRequestAction(request.id, 'rejected')}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Sent Requests</h3>
              {dashboardData.sent_requests.length === 0 ? (
                <p className="text-gray-600">No requests sent.</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.sent_requests.map(request => (
                    <div key={request.id} className="border rounded p-4">
                      <p className="font-semibold">Skill Swap Request</p>
                      <p className="text-sm text-gray-600">
                        You offer: <span className="font-medium">{request.requester_skill}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        You want: <span className="font-medium">{request.receiver_skill}</span>
                      </p>
                      <p className="text-sm text-gray-600 mb-2">Status: {request.status}</p>
                      {request.status === 'pending' && (
                        <button
                          onClick={() => deleteRequest(request.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Delete Request
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render current view
  const renderView = () => {
    switch(currentView) {
      case 'register': return <Register />;
      case 'login': return <Login />;
      case 'profile': return <Profile />;
      case 'browse': return <Browse />;
      case 'dashboard': return <Dashboard />;
      default: return <Home />;
    }
  };

  return (
    <div className="App">
      <Header />
      {renderView()}
    </div>
  );
}

export default App;