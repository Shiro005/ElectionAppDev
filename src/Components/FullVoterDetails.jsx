import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, ref, get, update } from '../Firebase/config';
import VoterSurvey from './VoterSurvey';
import FamilyManagement from './FamilyManagement';
import BluetoothPrinter from './BluetoothPrinter';
import {
  FiArrowLeft,
  FiUser,
  FiUsers,
  FiClipboard,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import TranslatedText from './TranslatedText';

const FullVoterDetails = () => {
  const { voterId } = useParams();
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);

  const [voter, setVoter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Candidate branding
  const candidateInfo = useMemo(() => ({
    name: "जननेता",
    party: "जननेता जनता पार्टी",
    electionSymbol: "जननेता",
    slogan: "सबका साथ, सबका विकास",
    contact: "8668722207",
    area: "वाशीम प्रभाग 1",
  }), []);

  // Cleanup function for abort controller
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadVoterDetails = useCallback(async () => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const voterRef = ref(db, `voters/${voterId}`);
      const snapshot = await get(voterRef);

      if (snapshot.exists()) {
        const voterData = { id: voterId, ...snapshot.val() };
        setVoter(voterData);

        // Load family members only if they exist and not in low bandwidth mode
        if (voterData.familyMembers && Object.keys(voterData.familyMembers).length > 0) {
          // For low internet speed, load family members sequentially with timeout
          const members = [];
          const memberIds = Object.keys(voterData.familyMembers);
          
          for (const memberId of memberIds) {
            try {
              const memberRef = ref(db, `voters/${memberId}`);
              const memberSnapshot = await Promise.race([
                get(memberRef),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout')), 10000) // 10 second timeout
                )
              ]);
              
              if (memberSnapshot.exists()) {
                members.push({ id: memberId, ...memberSnapshot.val() });
              }
            } catch (memberError) {
              console.warn(`Failed to load family member ${memberId}:`, memberError);
              // Continue with other members even if one fails
            }
          }
          
          setFamilyMembers(members);
        } else {
          setFamilyMembers([]);
        }
        
        setRetryCount(0); // Reset retry count on success
      } else {
        setVoter(null);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      console.error('Error loading voter details:', error);
      setError(error.message);
      
      // Auto-retry logic for low internet scenarios
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadVoterDetails();
        }, 2000 * (retryCount + 1)); // Exponential backoff: 2s, 4s, 6s
      }
    } finally {
      setLoading(false);
    }
  }, [voterId, retryCount]);

  useEffect(() => {
    loadVoterDetails();
  }, [loadVoterDetails]);

  const updateVoterField = useCallback(async (field, value) => {
    try {
      const voterRef = ref(db, `voters/${voterId}`);
      
      // Optimistic update for better UX on slow networks
      setVoter(prev => ({ ...prev, [field]: value }));
      
      await update(voterRef, { [field]: value });
    } catch (error) {
      console.error('Error updating voter:', error);
      // Revert optimistic update on error
      setVoter(prev => ({ ...prev, [field]: voter[field] }));
      setError('Failed to update. Please check your connection.');
    }
  }, [voterId, voter]);

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    loadVoterDetails();
  }, [loadVoterDetails]);

  if (loading && !voter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-300 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">
            <TranslatedText>Loading voter details...</TranslatedText>
            {retryCount > 0 && (
              <span className="block text-xs text-orange-600 mt-1">
                <TranslatedText>Attempt</TranslatedText> {retryCount + 1}/3
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (error && !voter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-3 text-gray-400">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            <TranslatedText>Connection Error</TranslatedText>
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            <TranslatedText>{error}</TranslatedText>
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <TranslatedText>Retry</TranslatedText>
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
            >
              <TranslatedText>Back to Dashboard</TranslatedText>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!voter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-3 text-gray-400">🔍</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            <TranslatedText>Voter Not Found</TranslatedText>
          </h2>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <TranslatedText>Back to Dashboard</TranslatedText>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <FiArrowLeft className="text-lg" />
              <span className="text-sm font-medium">
                <TranslatedText>Back</TranslatedText>
              </span>
            </button>

            {/* Tab Navigation */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { id: 'details', icon: FiUser, label: 'Details' },
                { id: 'family', icon: FiUsers, label: 'Family' },
                { id: 'survey', icon: FiClipboard, label: 'Survey' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <tab.icon className="text-sm" />
                  <span><TranslatedText>{tab.label}</TranslatedText></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-center">
            <span className="text-red-800 text-sm">
              <TranslatedText>{error}</TranslatedText>
            </span>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              <TranslatedText>Dismiss</TranslatedText>
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Candidate Branding Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 text-center">
            <div className="text-sm font-semibold opacity-90 mb-1">
              <TranslatedText>{candidateInfo.party}</TranslatedText>
            </div>
            <div className="text-xl font-bold mb-1">
              <TranslatedText>{candidateInfo.name}</TranslatedText>
            </div>
            <div className="text-xs opacity-80">
              <TranslatedText>{candidateInfo.slogan}</TranslatedText>
            </div>
          </div>

          <div className="p-5">
            {/* Voter Details Tab */}
            {activeTab === 'details' && (
              <div>
                <div className="text-center mb-6 border-b border-gray-200 pb-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    <TranslatedText>{voter.name}</TranslatedText>
                  </h1>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-6">
                  <DetailRow label="Voter ID" value={voter.voterId} />
                  <DetailRow label="Serial Number" value={voter.serialNumber} />
                  <DetailRow label="Booth Number" value={voter.boothNumber} />
                  <DetailRow label="WhatsApp Number" value={voter.whatsappNumber} />
                  <DetailRow 
                    label="Age & Gender" 
                    value={`${voter.age || 'N/A'} | ${voter.gender || 'N/A'}`} 
                  />
                  <DetailRow 
                    label="Polling Station Address" 
                    value={voter.pollingStationAddress} 
                    isFullWidth 
                  />
                </div>

                {/* Voting Status */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={voter.hasVoted || false}
                        onChange={(e) => updateVoterField('hasVoted', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                    <span className="text-sm font-medium text-gray-700">
                      {voter.hasVoted ? 
                        <TranslatedText>Voted ✓</TranslatedText> : 
                        <TranslatedText>Mark as Voted</TranslatedText>
                      }
                    </span>
                  </div>

                  <select
                    value={voter.supportStatus || 'unknown'}
                    onChange={(e) => updateVoterField('supportStatus', e.target.value)}
                    className={`text-sm font-medium rounded-full px-4 py-2 border ${voter.supportStatus === 'supporter'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : voter.supportStatus === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        : voter.supportStatus === 'not-supporter'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}
                  >
                    <option value="unknown">
                      <TranslatedText>Support Level</TranslatedText>
                    </option>
                    <option value="supporter">
                      <TranslatedText>Strong</TranslatedText>
                    </option>
                    <option value="medium">
                      <TranslatedText>Medium</TranslatedText>
                    </option>
                    <option value="not-supporter">
                      <TranslatedText>Not</TranslatedText>
                    </option>
                  </select>
                </div>
              </div>
            )}

            {/* Family Tab */}
            {activeTab === 'family' && (
              <FamilyManagement
                voter={voter}
                familyMembers={familyMembers}
                onUpdate={loadVoterDetails}
                candidateInfo={candidateInfo}
              />
            )}

            {/* Survey Tab */}
            {activeTab === 'survey' && (
              <VoterSurvey
                voter={voter}
                onUpdate={loadVoterDetails}
              />
            )}
          </div>
        </div>

        {/* Bluetooth Printer Section */}
        <BluetoothPrinter
          voter={voter}
          familyMembers={familyMembers}
          candidateInfo={candidateInfo}
        />
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, isFullWidth = false }) => (
  <div className={`flex ${isFullWidth ? 'flex-col' : 'justify-between items-center'} border-b border-gray-200 pb-3`}>
    <span className="font-medium text-gray-700 text-sm">
      <TranslatedText>{label}</TranslatedText>
    </span>
    <span className={`text-gray-900 text-sm ${isFullWidth ? 'mt-2 leading-relaxed' : ''}`}>
      {value || <TranslatedText>N/A</TranslatedText>}
    </span>
  </div>
);

export default FullVoterDetails;