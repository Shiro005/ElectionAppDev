import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { db } from '../Firebase/config';
import { collection, doc, getDoc, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { FiUsers, FiPlus, FiX, FiSearch, FiPrinter, FiMessageCircle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import TranslatedText from './TranslatedText';
import BluetoothPrinter from './BluetoothPrinter';

const FamilyManagement = ({ voter, familyMembers, onUpdate, candidateInfo }) => {
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [allVoters, setAllVoters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalQuery, setModalQuery] = useState('');
  const [modalPage, setModalPage] = useState(1);
  const [printing, setPrinting] = useState(false);
  const [loadingOperation, setLoadingOperation] = useState(false);
  const [voterData, setVoterData] = useState(null);
  const [addingMemberId, setAddingMemberId] = useState(null);
  
  const loadingRef = useRef(false);
  const pageSize = 50; // Reduced for better performance
  const modalDebounceRef = useRef(null);

  // Load voter data with contact information
  useEffect(() => {
    if (voter) {
      loadVoterData();
    }
  }, [voter]);

  // Initialize modal with optimized loading
  useEffect(() => {
    if (showFamilyModal) {
      initializeModal();
    }
  }, [showFamilyModal]);

  // Debounced search
  useEffect(() => {
    if (modalDebounceRef.current) clearTimeout(modalDebounceRef.current);
    modalDebounceRef.current = setTimeout(() => {
      setSearchTerm(modalQuery);
      setModalPage(1);
    }, 300);
    return () => {
      if (modalDebounceRef.current) clearTimeout(modalDebounceRef.current);
    };
  }, [modalQuery]);

  const loadVoterData = async () => {
    try {
      const docId = voter?.id || voter?.voterId;
      if (!docId) {
        setVoterData(voter);
        return;
      }

      const voterDocRef = doc(db, 'voters', String(docId));
      const voterDoc = await getDoc(voterDocRef);
      
      if (voterDoc.exists()) {
        setVoterData({ ...voter, ...voterDoc.data() });
      } else {
        setVoterData(voter);
      }
    } catch (error) {
      console.error('Error loading voter data:', error);
      setVoterData(voter);
    }
  };

  const initializeModal = async () => {
    try {
      setLoadingOperation(true);
      // Load voters only if not already loaded
      if (allVoters.length === 0) {
        await loadAllVoters();
      }
      setModalQuery(searchTerm || '');
      setModalPage(1);
      
      setTimeout(() => {
        const searchInput = document.getElementById('family-modal-search');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    } finally {
      setLoadingOperation(false);
    }
  };

  const loadAllVoters = async () => {
    try {
      const votersCol = collection(db, 'voters');
      const snapshot = await getDocs(votersCol);
      if (!snapshot.empty) {
        const votersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllVoters(votersData);
      } else {
        setAllVoters([]);
      }
    } catch (error) {
      console.error('Error loading all voters:', error);
    }
  };

  const saveContactNumber = async (number) => {
    try {
      const docId = voter?.id || voter?.voterId;
      if (!docId) throw new Error('Voter ID not available');
      
      const voterDocRef = doc(db, 'voters', String(docId));
      await setDoc(voterDocRef, { whatsapp: number }, { merge: true });
      
      setVoterData(prev => ({ ...prev, whatsapp: number }));
      return true;
    } catch (error) {
      console.error('Error saving WhatsApp number:', error);
      return false;
    }
  };

  const getWhatsAppNumber = () => {
    return voterData?.whatsapp || '';
  };

  const hasWhatsAppNumber = () => {
    const number = getWhatsAppNumber();
    return number && number.length === 10;
  };

  const validatePhoneNumber = (number) => {
    const cleaned = number.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  const addFamilyMember = async (memberId) => {
    if (loadingRef.current || addingMemberId) return;
    
    try {
      setAddingMemberId(memberId);
      loadingRef.current = true;

      const voterDocRef = doc(db, 'voters', voter.id);
      const memberDocRef = doc(db, 'voters', memberId);

      const [voterSnap, memberSnap] = await Promise.all([
        getDoc(voterDocRef),
        getDoc(memberDocRef)
      ]);

      if (!voterSnap.exists() || !memberSnap.exists()) {
        throw new Error('मतदार माहिती आढळली नाही');
      }

      const voterData = voterSnap.data();
      const memberData = memberSnap.data();

      if (voterData.familyMembers?.[memberId]) {
        alert('हा मतदार आधीच कुटुंबात आहे');
        return;
      }

      const familyMembersObj = { ...(voterData.familyMembers || {}) };
      familyMembersObj[memberId] = true;

      const memberFamily = { ...(memberData.familyMembers || {}) };
      memberFamily[voter.id] = true;

      const batch = writeBatch(db);
      batch.update(voterDocRef, { familyMembers: familyMembersObj });
      batch.update(memberDocRef, { familyMembers: memberFamily });
      await batch.commit();

      onUpdate?.();
      setShowFamilyModal(false);
      alert('कुटुंब सदस्य यशस्वीरित्या जोडला!');
    } catch (error) {
      console.error('Error adding family member:', error);
      alert('कुटुंब सदस्य जोडण्यात त्रुटी: ' + (error.message || error));
    } finally {
      setAddingMemberId(null);
      loadingRef.current = false;
    }
  };

  const removeFamilyMember = async (memberId) => {
    try {
      const voterDocRef = doc(db, 'voters', voter.id);
      const memberDocRef = doc(db, 'voters', memberId);

      const [voterSnap, memberSnap] = await Promise.all([getDoc(voterDocRef), getDoc(memberDocRef)]);
      const voterData = voterSnap.exists() ? voterSnap.data() : {};
      const memberData = memberSnap.exists() ? memberSnap.data() : {};

      const familyMembersObj = { ...(voterData.familyMembers || {}) };
      delete familyMembersObj[memberId];

      const memberFamily = { ...(memberData.familyMembers || {}) };
      delete memberFamily[voter.id];

      const batch = writeBatch(db);
      batch.update(voterDocRef, { familyMembers: familyMembersObj });
      batch.update(memberDocRef, { familyMembers: memberFamily });
      await batch.commit();

      onUpdate?.();
      alert('Family member removed successfully!');
    } catch (error) {
      console.error('Error removing family member:', error);
      alert('Failed to remove family member.');
    }
  };

  const generateWhatsAppMessage = useCallback(() => {
    if (!voterData || familyMembers.length === 0) return '';

    let message = `*${candidateInfo.party}*\n`;
    message += `*${candidateInfo.name}*\n`;
    // message += `${candidateInfo.slogan}\n\n`;

    message += `*कुटुंब तपशील*\n\n`;
    
    // Main voter (1)
    message += `*1) ${voterData.name}*\n`;
    message += `अनुक्रमांक: ${voterData.serialNumber || 'N/A'}\n`;
    message += `मतदार आयडी: ${voterData.voterId || 'N/A'}\n`;
    message += `बूथ क्रमांक: ${voterData.boothNumber || 'N/A'}\n`;
    message += `लिंग: ${voterData.gender || 'N/A'}\n`;
    message += `वय: ${voterData.age || 'N/A'}\n`;
    message += `मतदान केंद्र: ${voterData.pollingStationAddress || 'N/A'}\n\n`;

    // Family members (2...)
    familyMembers.forEach((member, index) => {
      message += `*${index + 2}) ${member.name}*\n`;
      message += `अनुक्रमांक: ${member.serialNumber || 'N/A'}\n`;
      message += `मतदार आयडी: ${member.voterId || 'N/A'}\n`;
      message += `बूथ क्रमांक: ${member.boothNumber || 'N/A'}\n`;
      message += `लिंग: ${member.gender || 'N/A'}\n`;
      message += `वय: ${member.age || 'N/A'}\n`;
      message += `मतदान केंद्र: ${member.pollingStationAddress || 'N/A'}\n\n`;
    });

    message += `मी आपला *शिवप्रसाद सुरेशराव चांगले* माझी निशाणी *तुतारी* या चिन्हावर मतदान करून मला प्रचंड बहुमतांनी विजय करा\n\n`;

    return message;
  }, [voterData, familyMembers, candidateInfo]);

  const handleWhatsAppShare = async () => {
    if (loadingRef.current) return;
    
    if (familyMembers.length === 0) {
      alert('कुटुंब सदस्य जोडलेले नाहीत');
      return;
    }

    try {
      setLoadingOperation(true);
      loadingRef.current = true;

      if (hasWhatsAppNumber()) {
        // Direct share if number exists
        const message = generateWhatsAppMessage();
        const url = `https://wa.me/91${getWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      } else {
        // Show modal to collect number
        setShowWhatsAppModal(true);
      }
    } catch (error) {
      console.error('WhatsApp sharing error:', error);
      alert('व्हॉट्सअॅप शेअर करण्यात त्रुटी: ' + (error.message || error));
    } finally {
      setLoadingOperation(false);
      loadingRef.current = false;
    }
  };

  const confirmWhatsAppShare = async () => {
    if (!validatePhoneNumber(whatsappNumber)) {
      alert('कृपया वैध 10-अंकी व्हॉट्सअॅप क्रमांक प्रविष्ट करा');
      return;
    }

    const cleanedNumber = whatsappNumber.replace(/\D/g, '');
    const saved = await saveContactNumber(cleanedNumber);
    
    if (saved) {
      const message = generateWhatsAppMessage();
      const url = `https://wa.me/91${cleanedNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      setShowWhatsAppModal(false);
      setWhatsappNumber('');
    } else {
      alert('व्हॉट्सअॅप क्रमांक जतन करण्यात त्रुटी आली');
    }
  };

  const printFamily = async () => {
    if (loadingRef.current) return;
    if (!familyMembers || familyMembers.length === 0) {
      alert('कुटुंब सदस्य जोडलेले नाहीत');
      return;
    }
    try {
      setPrinting(true);
      loadingRef.current = true;
      // Check if BluetoothPrinter is available
      if (typeof window.printFamily === 'function') {
        await window.printFamily(true);
      } else {
        alert('प्रिंटर कनेक्ट केलेला नाही. कृपया BluetoothPrinter कनेक्ट करा आणि पुन्हा प्रयत्न करा.');
      }
    } catch (error) {
      console.error('Printing error:', error);
      alert(error.message || 'प्रिंटिंग मध्ये त्रुटी आली');
    } finally {
      setPrinting(false);
      loadingRef.current = false;
    }
  };

  // Optimized filter logic with memoization
  const filteredVoters = useMemo(() => 
    allVoters.filter(vtr =>
      vtr.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      vtr.id !== voter.id &&
      !familyMembers.some(member => member.id === vtr.id)
    ),
    [allVoters, searchTerm, voter.id, familyMembers]
  );

  const voterSurname = useMemo(() => {
    if (!voter?.name) return '';
    const parts = String(voter.name).trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }, [voter]);

  const tokenizedFilter = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    if (!tokens.length) {
      return filteredVoters;
    }
    return filteredVoters.filter((v) => {
      const name = (v.name || '').toLowerCase();
      const voterId = String(v.voterId || '').toLowerCase();
      return tokens.every(token => name.includes(token) || voterId.includes(token));
    });
  }, [filteredVoters, searchTerm]);

  const [surnameTopList, surnameRestList] = useMemo(() => {
    if (!voterSurname) return [[], tokenizedFilter];
    const top = [];
    const rest = [];
    for (let item of tokenizedFilter) {
      const parts = String(item.name || '').trim().split(/\s+/);
      const last = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
      if (last === voterSurname) top.push(item);
      else rest.push(item);
    }
    return [top, rest];
  }, [tokenizedFilter, voterSurname]);

  const combinedList = useMemo(() => {
    return [...surnameTopList, ...surnameRestList];
  }, [surnameTopList, surnameRestList]);

  const totalPages = Math.max(1, Math.ceil(combinedList.length / pageSize));
  
  useEffect(() => {
    if (modalPage > totalPages) setModalPage(totalPages);
  }, [totalPages]);

  const paginatedList = useMemo(() => {
    const start = (modalPage - 1) * pageSize;
    return combinedList.slice(start, start + pageSize);
  }, [combinedList, modalPage]);

  // Keyboard ESC to close modal
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && showFamilyModal) {
        setShowFamilyModal(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showFamilyModal]);

  // WhatsApp Modal Component
  const WhatsAppModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md mx-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">व्हॉट्सअॅप क्रमांक प्रविष्ट करा</h3>
          <button
            onClick={() => {
              setShowWhatsAppModal(false);
              setWhatsappNumber('');
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              व्हॉट्सअॅप क्रमांक
            </label>
            <input
              type="tel"
              placeholder="10-अंकी व्हॉट्सअॅप क्रमांक"
              value={whatsappNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) {
                  setWhatsappNumber(value);
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              maxLength="10"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              हा क्रमांक डेटाबेसमध्ये जतन केला जाईल
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowWhatsAppModal(false);
                setWhatsappNumber('');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              रद्द करा
            </button>
            <button
              onClick={confirmWhatsAppShare}
              disabled={!validatePhoneNumber(whatsappNumber)}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                validatePhoneNumber(whatsappNumber)
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              व्हॉट्सअॅप वर पाठवा
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* WhatsApp Modal */}
      {showWhatsAppModal && <WhatsAppModal />}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <FiUsers className="text-orange-500" />
          <TranslatedText>Family Members</TranslatedText>
          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
            {familyMembers.length}
          </span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFamilyModal(true)}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
            disabled={loadingOperation}
          >
            <FiPlus className="text-sm" />
            <TranslatedText>Add</TranslatedText>
          </button>
        </div>
      </div>

      {/* Family Action Buttons */}
      {familyMembers.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={printFamily}
            disabled={printing}
            className="bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm hover:shadow-md"
          >
            <FiPrinter className="text-lg" />
            <span><TranslatedText>Print Family</TranslatedText></span>
          </button>
          <button
            onClick={handleWhatsAppShare}
            disabled={loadingOperation}
            className="bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm hover:shadow-md"
          >
            <FaWhatsapp className="text-lg" />
            <span><TranslatedText>Share Family</TranslatedText></span>
          </button>
        </div>
      )}

      {/* Family Members List */}
      <div className="space-y-3">
        {familyMembers.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors bg-white">
            <div className="flex-1">
              <div className="font-medium text-gray-900"><TranslatedText>{member.name}</TranslatedText></div>
              <div className="text-xs text-gray-500 mt-1">
                <TranslatedText>ID:</TranslatedText> {member.voterId} • 
                <TranslatedText>Age: {member.age || 'N/A'}</TranslatedText> • 
                <TranslatedText>Booth: {member.boothNumber || 'N/A'}</TranslatedText>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const link = `/voter/${member.id}`;
                  window.history.pushState(null, '', link);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-orange-600 hover:text-orange-700 text-xs font-medium px-3 py-1 bg-orange-50 rounded-md transition-colors"
              >
                <TranslatedText>View</TranslatedText>
              </button>
              <button
                onClick={() => removeFamilyMember(member.id)}
                className="text-red-600 hover:text-red-700 text-xs font-medium px-3 py-1 bg-red-50 rounded-md transition-colors"
              >
                <TranslatedText>Remove</TranslatedText>
              </button>
            </div>
          </div>
        ))}
      </div>

      {familyMembers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FiUsers className="text-4xl text-gray-300 mx-auto mb-3" />
          <p className="text-sm"><TranslatedText>No family members added yet.</TranslatedText></p>
        </div>
      )}

      {/* Family Modal */}
      {showFamilyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${loadingOperation ? 'opacity-75' : ''}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  <TranslatedText>Add Family Member</TranslatedText>
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  <TranslatedText>Search and select voters to add as family members</TranslatedText>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right text-xs text-gray-600 mr-2">
                  <div><strong>{combinedList.length}</strong> results</div>
                </div>
                <button
                  onClick={() => setShowFamilyModal(false)}
                  aria-label="Close"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiX className="text-lg text-gray-600" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 overflow-hidden">
              {/* Search bar */}
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="family-modal-search"
                  type="text"
                  value={modalQuery}
                  onChange={(e) => setModalQuery(e.target.value)}
                  placeholder="Type name or partial name (search not exact)..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-colors"
                />
              </div>

              {/* Surname header */}
              {voterSurname && surnameTopList.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm text-gray-700 font-medium">
                    <TranslatedText>Showing same surname first:</TranslatedText> 
                    <span className="ml-2 font-semibold"><TranslatedText>{voterSurname}</TranslatedText></span> • 
                    <span className="text-xs text-gray-500 ml-2">
                      <TranslatedText>{surnameTopList.length} matches</TranslatedText>
                    </span>
                  </div>
                </div>
              )}

              {/* Results list */}
              <div className="max-h-[60vh] overflow-y-auto border border-gray-100 rounded-md">
                {paginatedList.length > 0 ? paginatedList.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate"><TranslatedText>{v.name}</TranslatedText></h4>
                      <p className="text-sm text-gray-700 truncate">
                        <TranslatedText>ID:</TranslatedText> {v.voterId} • 
                        <TranslatedText>Booth: {v.boothNumber || 'N/A'}</TranslatedText>
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => addFamilyMember(v.id)}
                        disabled={addingMemberId === v.id}
                        className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiPlus className="text-xs" />
                        <TranslatedText>
                          {addingMemberId === v.id ? 'Adding...' : 'Add'}
                        </TranslatedText>
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <TranslatedText>No voters found matching your search.</TranslatedText>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalPage(prev => Math.max(1, prev - 1))}
                  disabled={modalPage <= 1}
                  className="px-3 py-2 bg-gray-100 text-sm rounded-md disabled:opacity-50 hover:bg-gray-200 transition-colors"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setModalPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={modalPage >= totalPages}
                  className="px-3 py-2 bg-gray-100 text-sm rounded-md disabled:opacity-50 hover:bg-gray-200 transition-colors"
                >
                  Next →
                </button>
                <div className="text-sm text-gray-600 ml-3">
                  Page {modalPage} / {totalPages}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600 mr-4">
                  Showing {combinedList.length === 0 ? 0 : ((modalPage - 1) * pageSize) + 1} - {Math.min(modalPage * pageSize, combinedList.length)} / {combinedList.length}
                </div>
                <button
                  onClick={() => setShowFamilyModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <TranslatedText>Close</TranslatedText>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BluetoothPrinter
        voter={voter}
        familyMembers={familyMembers}
        candidateInfo={candidateInfo}
      />
    </div>
  );
};

export default FamilyManagement;